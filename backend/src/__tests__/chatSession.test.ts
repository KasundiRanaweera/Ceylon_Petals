import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

// The chatbot with a REAL in-memory PostgreSQL and REAL login cookies (only the AI call is faked).
// Proves that "my orders" in the chat works for a signed-in customer, shows only their own orders,
// and never leaks contact details, addresses or anyone else's orders.
vi.mock('../lib/prisma.js', async () => ({ prisma: (await import('./helpers/testDb.js')).prisma }))

const { resetDb, seedShop, makeProduct, makeUser, makeOrder } = await import('./helpers/testDb.js')
const { createApp } = await import('../app.js')
const { runTool } = await import('../services/chatTools.js')
const { buildSystemPrompt } = await import('../lib/chatPrompt.js')
const { POLICIES } = await import('../lib/chatKnowledge.js')
const app = createApp()

const aiToolCall = (name: string) => ({
  choices: [{ message: { role: 'assistant', content: null, tool_calls: [{ id: 'c1', type: 'function', function: { name, arguments: '{}' } }] } }],
})
const aiText = (content: string) => ({ choices: [{ message: { role: 'assistant', content } }] })

let fetchMock: ReturnType<typeof vi.fn>
let alice: Awaited<ReturnType<typeof makeUser>>
let bob: Awaited<ReturnType<typeof makeUser>>
let aliceOrder: { number: number }
let bobOrder: { number: number }

beforeEach(async () => {
  await resetDb()
  await seedShop()
  const roses = await makeProduct({ slug: 'roses', name: 'Crimson Roses', price: 5000 })
  alice = await makeUser('CUSTOMER', { email: 'alice@example.com', name: 'Alice Perera', phone: '0771111111' })
  bob = await makeUser('CUSTOMER', { email: 'bob@example.com', name: 'Bob Silva', phone: '0772222222' })
  aliceOrder = await makeOrder({ userId: alice.user.id, status: 'PREPARING', paymentStatus: 'PAID', customerPhone: '0771111111', items: [{ productId: roses.id, name: 'Crimson Roses', unitPrice: 5000, quantity: 1 }] })
  bobOrder = await makeOrder({ userId: bob.user.id, status: 'DELIVERED', customerPhone: '0772222222', items: [{ productId: roses.id, name: 'Crimson Roses', unitPrice: 5000, quantity: 2 }] })
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

/** Asks "where is my order?" and returns what the AI model was shown by the get_my_orders tool. */
async function toolResultSeenByModel(cookie?: string) {
  fetchMock
    .mockResolvedValueOnce(new Response(JSON.stringify(aiToolCall('get_my_orders'))))
    .mockResolvedValueOnce(new Response(JSON.stringify(aiText('Here is your order status.'))))
  const req = request(app).post('/api/chat')
  if (cookie) req.set('Cookie', cookie)
  const res = await req.send({ messages: [{ role: 'user', content: 'Where is my order?' }] })
  expect(res.status).toBe(200)
  const second = JSON.parse(fetchMock.mock.calls[1]![1].body as string)
  return String(second.messages.find((m: { role: string }) => m.role === 'tool').content)
}

describe('chatbot with a real signed-in session', () => {
  it("shows a signed-in customer their own order status, and only theirs", async () => {
    const seen = await toolResultSeenByModel(alice.cookie)
    expect(seen).toContain(`"order_number":"CP-${aliceOrder.number}"`)
    expect(seen).toContain('PREPARING')
    expect(seen).not.toContain(`"order_number":"CP-${bobOrder.number}"`)
    expect(seen).not.toContain('DELIVERED')
  })

  it('gives the other customer only their own order', async () => {
    const seen = await toolResultSeenByModel(bob.cookie)
    expect(seen).toContain(`"order_number":"CP-${bobOrder.number}"`)
    expect(seen).not.toContain(`"order_number":"CP-${aliceOrder.number}"`)
  })

  it('never sends names, phone numbers, e-mails, addresses or notes to the AI service', async () => {
    const seen = await toolResultSeenByModel(alice.cookie)
    for (const secret of ['Alice', 'Perera', '0771111111', 'alice@example.com', '12 Lake Road', 'Dilini', '94715556666', 'Colombo 07']) {
      expect(seen).not.toContain(secret)
    }
    // And nothing private anywhere in what was sent to the AI service (prompt, history, tool results).
    const everything = fetchMock.mock.calls.map((c) => String(c[1].body)).join('\n')
    expect(everything).not.toContain('0771111111')
    expect(everything).not.toContain('alice@example.com')
  })

  it('treats a guest as signed out', async () => {
    const seen = await toolResultSeenByModel()
    expect(JSON.parse(seen).signed_in).toBe(false)
    expect(seen).not.toContain(`"order_number"`)
  })

  it('treats a forged or tampered login cookie as signed out', async () => {
    const seen = await toolResultSeenByModel('cp_session=' + alice.cookie.split('=')[1]!.slice(0, -4) + 'AAAA')
    expect(JSON.parse(seen).signed_in).toBe(false)
  })

  it('a customer cannot reach another customer by passing arguments to the tool', async () => {
    // The tool takes no arguments: whatever the model (or an attacker prompt) sends, only the session user is used.
    const text = await runTool('get_my_orders', JSON.stringify({ user_id: bob.user.id, userId: bob.user.id, order_number: bobOrder.number }), { user: alice.user as never, seenProducts: new Map() })
    expect(text).toContain(`"order_number":"CP-${aliceOrder.number}"`)
    expect(text).not.toContain(`"order_number":"CP-${bobOrder.number}"`)
  })
})

describe('refund answers are kept strict', () => {
  it('the refund policy separates replacement from refund and forbids invented conditions', () => {
    const text = POLICIES.refunds.text
    expect(text).toMatch(/REPLACEMENT.*24 hours.*free of charge/s)
    expect(text).toMatch(/does NOT promise a refund for wilted or damaged flowers/)
    expect(text).toMatch(/never say "if a replacement is not possible"/)
    expect(text).toMatch(/ANSWER RULE: state only what is written above/)
    expect(text).toMatch(/5-7 working days/)
  })

  it('the system prompt forbids promising or implying refunds', () => {
    const prompt = buildSystemPrompt()
    expect(prompt).toMatch(/never promise or imply a refund/i)
    expect(prompt).toMatch(/replacement only/i)
    expect(prompt).toMatch(/if a replacement is not possible/)
  })

  it('serves the refund policy to the model through get_policy', async () => {
    const result = JSON.parse(await runTool('get_policy', '{"topic":"refunds"}', { user: undefined, seenProducts: new Map() }))
    expect(result.policy).toBe(POLICIES.refunds.text)
    expect(result.page).toBe('/refund-policy')
  })
})
