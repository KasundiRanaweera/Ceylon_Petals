import { Link } from 'react-router-dom'
import { MessageCircle, Phone, PenLine } from 'lucide-react'
import { useShop, useWhatsApp } from '../../hooks/useShop'

export default function ConsultationCTA() {
  const { phone } = useShop()
  const whatsapp = useWhatsApp()

  return (
    <section className="w-full px-4 lg:px-12 py-20 lg:py-28 bg-surface">
      <div className="max-w-7xl mx-auto rounded-xl bg-surface-container-lowest ring-1 ring-outline-variant/40 shadow-[0_18px_40px_-28px_rgba(48,48,48,0.35)] p-8 lg:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7">
            <span className="text-[13px] font-medium uppercase tracking-[0.22em] text-tertiary block">Can't find what you're looking for?</span>
            <h2 className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] leading-tight text-on-surface">Speak with one of our florists</h2>
            <p className="mt-4 text-[15px] text-on-surface-variant max-w-2xl leading-relaxed">
              Need a large arrangement, a particular colour, or something for a bulk order? Message us on
              WhatsApp, call the studio, or send us the details and we'll get back to you with a quote.
            </p>
          </div>
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
            <a
              href={whatsapp("Hello, I'd like help choosing flowers for a special occasion.")}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] text-white hover:bg-[#1EBE5D] px-4 py-3 rounded-lg text-title-md flex items-center justify-center gap-2 shadow-md transition-colors"
            >
              <MessageCircle size={20} /> Chat on WhatsApp
            </a>
            <a
              href={`tel:${phone.replace(/\s/g, '')}`}
              className="rounded-lg border border-[#d4af37] text-tertiary hover:bg-[#d4af37] hover:text-on-tertiary-container px-4 py-3 text-title-md flex items-center justify-center gap-2 transition-colors"
            >
              <Phone size={18} /> Call {phone}
            </a>
            <Link
              to="/custom-order"
              className="rounded-lg border border-[#d4af37] text-tertiary hover:bg-[#d4af37] hover:text-on-tertiary-container px-4 py-3 text-title-md flex items-center justify-center gap-2 transition-colors"
            >
              <PenLine size={18} /> Request a custom order
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
