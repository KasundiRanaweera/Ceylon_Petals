import { useEffect, useRef, useState } from 'react'
import { Check, Copy, KeyRound, MessageCircle, X } from 'lucide-react'
import { buildWhatsAppLink } from '../../lib/whatsapp'
import type { PasswordResetLink } from '../../services/shop'

interface ResetLinkDialogProps {
  customer: { name: string; phone: string }
  link: PasswordResetLink
  shopName: string
  onClose: () => void
}

// Shows the one-time password reset link the owner just made, with the two ways to pass it on:
// copy it, or open WhatsApp with it already written to the customer. Escape or the backdrop closes it.
export default function ResetLinkDialog({ customer, link, shopName, onClose }: ResetLinkDialogProps) {
  const [copied, setCopied] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const firstName = customer.name.trim().split(/\s+/)[0]
  const until = new Date(link.expiresAt).toLocaleTimeString('en-LK', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Colombo' })
  const message = `Hello ${firstName}, this is ${shopName}. Here is your link to choose a new password. It works once, until ${until}:\n${link.url}`

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function copy() {
    try {
      await navigator.clipboard.writeText(link.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // the browser refused the clipboard: the link is selected in the box, ready to copy by hand
      document.getElementById('reset-link')?.focus()
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-link-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg space-y-4 rounded-xl bg-surface-container-lowest p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-tertiary">
              <KeyRound size={18} />
            </span>
            <div>
              <h2 id="reset-link-title" className="text-title-lg text-on-surface">Password reset link for {customer.name}</h2>
              <p className="text-body-sm text-secondary">Works once, until {until}. Making a new link cancels this one.</p>
            </div>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-lg text-secondary hover:bg-surface-container">
            <X size={18} />
          </button>
        </div>

        <label htmlFor="reset-link" className="block text-label-md text-on-surface-variant">
          Link
        </label>
        <input
          id="reset-link"
          readOnly
          value={link.url}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full rounded-lg bg-surface-container-low px-3 py-2 font-mono text-[12.5px] text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <p className="text-body-sm text-secondary">Only send it to the customer's own number. Anyone with the link can set the password until it is used.</p>

        <div className="flex flex-wrap justify-end gap-3 pt-1">
          <button type="button" onClick={copy} className="inline-flex items-center gap-2 rounded-lg bg-surface-container-high px-4 py-2 text-label-md text-primary hover:bg-surface-container-highest">
            {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy link'}
          </button>
          <a
            href={buildWhatsAppLink(message, customer.phone)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 text-label-md text-white hover:bg-[#1ebe5b]"
          >
            <MessageCircle size={16} /> Send on WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
