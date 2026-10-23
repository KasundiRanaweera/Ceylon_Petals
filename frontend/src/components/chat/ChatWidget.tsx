import { Fragment, useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { MessageCircle, Send, X, Flower2, RotateCcw } from 'lucide-react'
import { sendChat, type ChatProduct, type ChatTurn } from '../../services/chat'
import { formatLKR } from '../../lib/format'
import { ApiError } from '../../lib/api'
import { closeChat, openChat, useChatOpen } from '../../lib/chatLauncher'

// Customer support chatbot: a round chat button that opens a chat window. It only talks to our own
// API (/api/chat); answers about products, prices and policies come from the shop's live data.
// The button floats beside the WhatsApp button (same size and shape). On phones it floats only on
// the home page; on other pages the nav bar has a chat button that opens this same window.

interface Message extends ChatTurn {
  id: number
  products?: ChatProduct[]
  failed?: boolean
}

const WELCOME = "Hello! 🌸 Welcome to Ceylon Petals! I'm your virtual flower assistant. Looking for the perfect bouquet or need help with an order? I'd be delighted to help!"
const SUGGESTIONS = ['Birthday bouquet under Rs. 5,000', 'Do you have red roses?', 'How much does delivery cost?', 'How can I track my order?', 'How do I care for my roses?']
const MAX_LENGTH = 1000

// Turns "/track-order" in an answer into a real link, so the customer can tap straight to the page.
const PAGE_PATH = /(\/(?:shop|track-order|delivery|faq|care-guide|refund-policy|custom-order|wedding-events|about|cart|checkout|sign-in|register|account(?:\/orders)?|products\/[a-z-]+|product\/[a-z0-9-]+))(?![\w/-])/g

function renderText(text: string, onNavigate: () => void): ReactNode {
  const clean = text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/^#+\s*/gm, '')
  const parts = clean.split(PAGE_PATH)
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <Link key={i} to={part} onClick={onNavigate} className="font-medium text-tertiary underline underline-offset-2 hover:text-on-surface">
        {part}
      </Link>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  )
}

function ProductCard({ product, onNavigate }: { product: ChatProduct; onNavigate: () => void }) {
  return (
    <Link
      to={product.url}
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-xl bg-surface-container-lowest p-2 ring-1 ring-outline-variant/50 transition-colors hover:ring-[#d4af37]/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4af37]"
    >
      {product.imageUrl ? (
        <img src={product.imageUrl} alt="" loading="lazy" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
      ) : (
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-surface-container text-tertiary"><Flower2 size={22} /></span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-[14px] font-medium text-on-surface">{product.name}</span>
        <span className="block text-[13px] text-tertiary">
          {formatLKR(product.price)}
          {product.originalPrice ? <s className="ml-2 text-on-surface-variant/70">{formatLKR(product.originalPrice)}</s> : null}
        </span>
      </span>
    </Link>
  )
}

export default function ChatWidget() {
  const { pathname } = useLocation()
  const open = useChatOpen()
  const onHome = pathname === '/'
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const nextId = useRef(1)
  const scroller = useRef<HTMLDivElement>(null)
  const field = useRef<HTMLTextAreaElement>(null)
  // Product pages have a sticky bar on phones, so the launcher sits a little higher there.
  const onProductPage = pathname.startsWith('/product/')

  const close = useCallback(() => closeChat(), [])

  // A full-screen window on phones: keep the page behind it from scrolling.
  useEffect(() => {
    if (!open || !window.matchMedia('(max-width: 639px)').matches) return
    const before = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = before
    }
  }, [open])

  // Keep the newest message in view.
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy, open])

  useEffect(() => {
    if (open) field.current?.focus()
  }, [open])

  // Escape closes the chat window.
  useEffect(() => {
    if (!open) return
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  const send = useCallback(
    async (raw: string, history: Message[]) => {
      const text = raw.trim().slice(0, MAX_LENGTH)
      if (!text || busy) return
      const userMessage: Message = { id: nextId.current++, role: 'user', content: text }
      const thread = [...history, userMessage]
      setMessages(thread)
      setInput('')
      setBusy(true)
      try {
        // Only the real conversation is sent: failed attempts and the welcome line are not.
        const sendable = thread.filter((m) => !m.failed).map(({ role, content }) => ({ role, content }))
        const answer = await sendChat(sendable)
        setMessages((m) => [...m, { id: nextId.current++, role: 'assistant', content: answer.reply, products: answer.products }])
      } catch (error) {
        const message =
          error instanceof ApiError && error.status === 429
            ? "You're sending messages very quickly. Please wait a minute and try again."
            : error instanceof ApiError && error.status === 400
              ? error.message
              : "Sorry, I couldn't connect just now. Please check your connection and try again, or message us on WhatsApp."
        setMessages((m) => [...m, { id: nextId.current++, role: 'assistant', content: message, failed: true }])
      } finally {
        setBusy(false)
        field.current?.focus()
      }
    },
    [busy]
  )

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void send(input, messages)
  }
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send(input, messages)
    }
  }

  return (
    <>
      {/* The round chat icon: clicking it opens the chat window. */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="launcher"
            type="button"
            onClick={openChat}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            aria-label="Chat with the Ceylon Petals Assistant"
            title="Ask us anything"
            className={`fixed right-6 z-40 h-14 w-14 items-center justify-center rounded-full bg-brand-gradient text-[#1b1c1c] shadow-[0_12px_32px_-4px_rgba(12,10,9,0.3)] transition-transform hover:scale-105 ${
              onProductPage ? 'bottom-28 lg:bottom-24' : 'bottom-24'
            } ${onHome ? 'flex' : 'hidden sm:flex'}`}
          >
            <MessageCircle size={28} aria-hidden="true" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.section
            key="panel"
            role="dialog"
            aria-label="Ceylon Petals Assistant"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed z-50 flex flex-col overflow-hidden bg-surface text-on-surface shadow-[0_24px_60px_-12px_rgba(12,10,9,0.45)] ring-1 ring-outline-variant/60 max-sm:inset-0 max-sm:h-dvh sm:bottom-6 sm:right-6 sm:h-[min(640px,calc(100dvh-3rem))] sm:w-[400px] sm:rounded-2xl"
          >
            <header className="flex items-center gap-3 border-b border-outline-variant/50 bg-surface-container-low px-4 py-3 max-sm:pt-[max(0.75rem,env(safe-area-inset-top))]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-white"><Flower2 size={20} aria-hidden="true" /></span>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-[18px] leading-tight text-on-surface">Ceylon Petals Assistant</h2>
                <p className="text-[12px] text-on-surface-variant">Ask about flowers, delivery & orders</p>
              </div>
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMessages([])}
                  disabled={busy}
                  aria-label="Start a new conversation"
                  title="New conversation"
                  className="flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:opacity-40 sm:h-9 sm:w-9"
                >
                  <RotateCcw size={17} aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                onClick={close}
                aria-label="Close chat"
                className="flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high sm:h-9 sm:w-9"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </header>

            <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite" aria-relevant="additions">
              <div className="max-w-[88%] rounded-2xl rounded-bl-md bg-surface-container px-4 py-2.5 text-[14.5px] leading-relaxed text-on-surface">{WELCOME}</div>

              {messages.length === 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void send(s, messages)}
                      className="min-h-10 rounded-full border border-[#d4af37]/60 px-3.5 py-2 text-left text-[13.5px] text-on-surface transition-colors hover:bg-surface-container-high sm:min-h-0 sm:px-3 sm:py-1.5 sm:text-[13px]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((m) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className={m.role === 'user' ? 'flex justify-end' : 'space-y-2'}>
                  <div
                    className={
                      m.role === 'user'
                        ? 'max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-[14.5px] leading-relaxed text-on-primary'
                        : `max-w-[88%] whitespace-pre-wrap break-words rounded-2xl rounded-bl-md px-4 py-2.5 text-[14.5px] leading-relaxed ${m.failed ? 'bg-error-container text-on-error-container' : 'bg-surface-container text-on-surface'}`
                    }
                  >
                    {m.role === 'user' ? m.content : renderText(m.content, close)}
                  </div>
                  {m.products && m.products.length > 0 && (
                    <div className="grid max-w-[88%] gap-2">
                      {m.products.map((p) => (
                        <ProductCard key={p.slug} product={p} onNavigate={close} />
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}

              {busy && (
                <div className="flex max-w-[88%] items-center gap-1.5 rounded-2xl rounded-bl-md bg-surface-container px-4 py-3" role="status" aria-label="The assistant is typing">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-2 w-2 rounded-full bg-tertiary"
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={onSubmit} className="flex items-end gap-2 border-t border-outline-variant/50 bg-surface-container-low p-3 max-sm:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <label htmlFor="chat-input" className="sr-only">Your message</label>
              <textarea
                id="chat-input"
                ref={field}
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, MAX_LENGTH))}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Type your question…"
                className="max-h-28 min-h-11 flex-1 resize-none rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-[16px] text-on-surface sm:text-[15px] placeholder:text-on-surface-variant/70 focus:border-[#d4af37] focus:outline-none"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                aria-label="Send message"
                className="btn-gradient flex h-11 w-11 shrink-0 items-center justify-center rounded-xl disabled:opacity-40"
              >
                <Send size={18} aria-hidden="true" />
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  )
}
