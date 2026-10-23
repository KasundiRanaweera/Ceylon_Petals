import { env } from '../config/env.js'
import { runTool, toolSpecs, type ChatProduct, type ToolContext } from './chatTools.js'
import { getPublicSettings } from './settings.js'
import { buildSystemPrompt } from '../lib/chatPrompt.js'
import { formatPhone } from '../lib/phone.js'
import type { Viewer } from './orders.js'

// The customer support chatbot. The AI model (Groq) can only talk and call the read-only tools in
// chatTools.ts; it has no access to the database, to orders it was not given, or to any write action.

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatReply {
  reply: string
  products: ChatProduct[]
  /** True when the AI could not answer and this is the canned contact-us message. */
  fallback: boolean
}

const MAX_TOOL_ROUNDS = 3
const REQUEST_TIMEOUT_MS = 25_000
const MAX_RETRY_WAIT_MS = 12_000
// The website stops waiting after 20 seconds, so the whole answer (every AI call, retry and tool
// round together) must finish sooner. When time runs out the customer gets the contact-us message.
const TOTAL_BUDGET_MS = 17_000
const MIN_CALL_MS = 1_500


interface GroqMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  tool_calls?: { id: string; type: 'function'; function: { name: string; arguments: string } }[]
  tool_call_id?: string
}

interface GroqResponse {
  choices?: { message?: GroqMessage }[]
}

async function callModelOnce(messages: GroqMessage[], withTools: boolean, deadline: number): Promise<GroqMessage> {
  const left = deadline - Date.now()
  if (left < MIN_CALL_MS) throw new Error('chat time budget used up')
  const controller = new AbortController()
  // each call may use what is left of the budget, but never more than the per-call limit
  const timer = setTimeout(() => controller.abort(), Math.min(REQUEST_TIMEOUT_MS, left))
  try {
    const res = await fetch(`${env.groq.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.groq.apiKey}` },
      body: JSON.stringify({
        model: env.groq.model,
        messages,
        temperature: 0.3,
        max_tokens: 500,
        reasoning_effort: 'low',
        // The tool list is always sent (the conversation contains tool calls, which Groq rejects without it);
        // on the last round tool_choice "none" forces a plain-text answer.
        tools: toolSpecs,
        tool_choice: withTools ? 'auto' : 'none',
      }),
      signal: controller.signal,
    })
    if (!res.ok) {
      // On a rate limit Groq says how many seconds to wait; we wait that long once if it is short.
      const waitMs = Math.ceil(Number(res.headers.get('retry-after')) * 1000)
      throw new TransientError(`Groq responded ${res.status}`, res.status === 429 || res.status >= 500, Number.isFinite(waitMs) ? waitMs : 0)
    }
    const message = ((await res.json()) as GroqResponse).choices?.[0]?.message
    if (!message) throw new Error('Groq returned no message')
    return message
  } finally {
    clearTimeout(timer)
  }
}

class TransientError extends Error {
  constructor(message: string, readonly retryable: boolean, readonly waitMs = 0) {
    super(message)
  }
}

/** One automatic retry for a dropped connection, a timeout, a rate limit or a server error; anything else fails at once. */
async function callModel(messages: GroqMessage[], withTools: boolean, deadline: number): Promise<GroqMessage> {
  try {
    return await callModelOnce(messages, withTools, deadline)
  } catch (error) {
    const retryable = error instanceof TransientError ? error.retryable : error instanceof TypeError || (error instanceof Error && error.name === 'AbortError')
    const wait = error instanceof TransientError ? error.waitMs : 0
    // A rate limit that clears in a few seconds is worth waiting for; a long one is not (the customer is waiting).
    const pause = Math.max(wait, 800)
    // no retry when it is not the kind of error that clears up, the wait is long, or the budget would run out
    if (!retryable || wait > MAX_RETRY_WAIT_MS || deadline - Date.now() < pause + MIN_CALL_MS) throw error
    await new Promise((resolve) => setTimeout(resolve, pause))
    return callModelOnce(messages, withTools, deadline)
  }
}

/** Shown when the AI is switched off, busy or failing. Uses the shop's real contact details when we can read them. */
async function fallbackReply(): Promise<ChatReply> {
  let contact = 'Please use the contact details in the footer, or the /faq and /delivery pages.'
  try {
    const s = await getPublicSettings()
    contact = `You can reach us on WhatsApp ${formatPhone(s.whatsappNumber)}${s.email ? ` or at ${s.email}` : ''}${s.openingHours ? ` (${s.openingHours})` : ''}. The /faq, /delivery and /track-order pages may also help.`
  } catch {
    /* keep the generic message */
  }
  return { reply: `Sorry, I can't answer that right now. ${contact}`, products: [], fallback: true }
}

/**
 * The chat window shows plain text, and the prompt asks the model for plain text, but models still
 * add markdown now and then. Bold markers, headings and code ticks would show up as stray symbols,
 * so they are removed here; "- " lists are kept because the window shows them fine.
 */
export function plainText(reply: string): string {
  return reply
    .replace(/\*\*(.+?)\*\*/gs, '$1')
    .replace(/__(.+?)__/gs, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/`+/g, '')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// The model sometimes swaps a hyphen for a look-alike dash or adds extra spaces; compare without those differences.
const plain = (text: string) => text.toLowerCase().replace(/\p{Pd}/gu, '-').replace(/\s+/g, ' ')

/** Cards are shown only for products the answer actually names, so they always match the text. */
function mentionedProducts(reply: string, seen: Map<string, ChatProduct>): ChatProduct[] {
  const text = plain(reply)
  return [...seen.values()].filter((p) => text.includes(plain(p.name))).slice(0, 4)
}

export async function answerChat(history: ChatTurn[], user: Viewer['user']): Promise<ChatReply> {
  if (!env.groq.configured) return fallbackReply()

  const deadline = Date.now() + TOTAL_BUDGET_MS
  const ctx: ToolContext = { user, seenProducts: new Map() }
  const messages: GroqMessage[] = [{ role: 'system', content: buildSystemPrompt() }, ...history]

  try {
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      // On the last round tools are withheld so the model has to answer with what it already has.
      const message = await callModel(messages, round < MAX_TOOL_ROUNDS, deadline)
      const calls = message.tool_calls ?? []
      if (calls.length === 0) {
        const reply = plainText(message.content ?? '')
        if (!reply) return fallbackReply()
        return { reply, products: mentionedProducts(reply, ctx.seenProducts), fallback: false }
      }
      messages.push({ role: 'assistant', content: message.content ?? null, tool_calls: calls })
      for (const call of calls) {
        messages.push({ role: 'tool', tool_call_id: call.id, content: await runTool(call.function.name, call.function.arguments, ctx) })
      }
    }
    return fallbackReply()
  } catch (error) {
    // Never include the request (it carries the API key) in the log.
    console.error('chat failed:', error instanceof Error ? error.message : error)
    return fallbackReply()
  }
}
