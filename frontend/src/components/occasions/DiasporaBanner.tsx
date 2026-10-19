import { Link } from 'react-router-dom'
import { Globe, Camera, CreditCard, Clock, MessageCircle } from 'lucide-react'
import { useWhatsApp } from '../../hooks/useShop'

export default function DiasporaBanner() {
  const whatsapp = useWhatsApp()
  const link = whatsapp("Hello, I'd like to send flowers to a loved one in Colombo from overseas")

  return (
    <section className="max-w-7xl mx-auto w-full px-4 lg:px-12 py-20 lg:py-28">
      <div className="relative rounded-xl bg-ink-gradient text-on-primary overflow-hidden shadow-[0_30px_60px_-30px_rgba(48,48,48,0.6)] p-8 lg:p-14">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#d4af37]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-tertiary-container/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-[11px] uppercase tracking-[0.22em] text-[#e9c349] ring-1 ring-[#e9c349]/30">
              <Globe size={15} />
              Serving Overseas Patrons (UK, Australia, USA, UAE & Canada)
            </div>
            <h2 className="font-display text-[clamp(2rem,4vw,3rem)] leading-tight text-white">
              Sending Love from Overseas? We Deliver with Proof of Joy.
            </h2>
            <p className="text-body-lg text-white/70 max-w-2xl leading-relaxed">
              Distance shouldn't get in the way of celebrating with family back home. We coordinate
              directly with your recipient, handle delivery with care, and send handover photos
              straight to your WhatsApp.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="flex items-center gap-2 text-body-sm text-white/70">
                <Camera size={20} className="text-[#e9c349]" />
                <span>WhatsApp Handover Photo</span>
              </div>
              <div className="flex items-center gap-2 text-body-sm text-white/70">
                <CreditCard size={20} className="text-[#e9c349]" />
                <span>Secure Global Cards & PayHere</span>
              </div>
              <div className="flex items-center gap-2 text-body-sm text-white/70">
                <Clock size={20} className="text-[#e9c349]" />
                <span>Colombo Time-Synced Delivery</span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3">
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#25D366] text-white text-title-md px-6 py-4 rounded-lg hover:opacity-95 transition-opacity shadow-md text-center"
            >
              <MessageCircle size={22} />
              <span>WhatsApp Overseas Concierge</span>
            </a>
            <Link
              to="/products/fresh-bouquets"
              className="rounded-lg border border-[#d4af37] text-[#e9c349] text-title-md px-6 py-4 transition-colors hover:bg-[#d4af37] hover:text-on-tertiary-container text-center"
            >
              Order for Colombo Delivery Now
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}