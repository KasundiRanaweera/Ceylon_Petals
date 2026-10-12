import { Link } from 'react-router-dom'
import { MessageCircle, Phone, PenLine } from 'lucide-react'
import { useShop, useWhatsApp } from '../../hooks/useShop'

export default function ConsultationCTA() {
  const { phone } = useShop()
  const whatsapp = useWhatsApp()

  return (
    <section className="w-full px-4 lg:px-12 py-14 bg-surface">
      <div className="max-w-7xl mx-auto bg-surface-container-lowest rounded-2xl p-8 lg:p-12 shadow-md">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-1">
            <span className="text-[11px] text-secondary uppercase tracking-widest block">Can't find what you're looking for?</span>
            <h2 className="font-display text-headline-lg text-primary">Speak with one of our florists</h2>
            <p className="text-body-md text-on-surface-variant max-w-2xl leading-relaxed">
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
              className="bg-surface-container hover:bg-surface-container-high text-primary px-4 py-3 rounded-lg text-title-md flex items-center justify-center gap-2 transition-colors"
            >
              <Phone size={18} /> Call {phone}
            </a>
            <Link
              to="/custom-order"
              className="bg-surface-container hover:bg-surface-container-high text-primary px-4 py-3 rounded-lg text-title-md flex items-center justify-center gap-2 transition-colors"
            >
              <PenLine size={18} /> Request a custom order
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
