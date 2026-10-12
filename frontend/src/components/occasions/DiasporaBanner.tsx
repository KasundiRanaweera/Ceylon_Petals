import { Link } from 'react-router-dom'
import { Globe, Camera, CreditCard, Clock, MessageCircle } from 'lucide-react'
import { useWhatsApp } from '../../hooks/useShop'

export default function DiasporaBanner() {
  const whatsapp = useWhatsApp()
  const link = whatsapp("Hello, I'd like to send flowers to a loved one in Colombo from overseas")

  return (
    <section className="max-w-7xl mx-auto w-full px-4 lg:px-12 py-14">
      <div className="relative rounded-2xl bg-primary text-on-primary overflow-hidden shadow-xl p-8 lg:p-12">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-surface-tint/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-tertiary-container/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 bg-primary-container text-primary-fixed px-4 py-1 rounded-sm text-[11px] tracking-wider uppercase">
              <Globe size={15} />
              Serving Overseas Patrons (UK, Australia, USA, UAE & Canada)
            </div>
            <h2 className="font-display text-headline-lg lg:text-[38px] lg:leading-[46px] text-on-primary">
              Sending Love from Overseas? We Deliver with Proof of Joy.
            </h2>
            <p className="text-body-lg text-inverse-primary max-w-2xl leading-relaxed">
              Distance shouldn't get in the way of celebrating with family back home. We coordinate
              directly with your recipient, handle delivery with care, and send handover photos
              straight to your WhatsApp.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="flex items-center gap-2 text-body-sm text-primary-fixed-dim">
                <Camera size={20} className="text-tertiary-fixed" />
                <span>WhatsApp Handover Photo</span>
              </div>
              <div className="flex items-center gap-2 text-body-sm text-primary-fixed-dim">
                <CreditCard size={20} className="text-tertiary-fixed" />
                <span>Secure Global Cards & PayHere</span>
              </div>
              <div className="flex items-center gap-2 text-body-sm text-primary-fixed-dim">
                <Clock size={20} className="text-tertiary-fixed" />
                <span>Colombo Time-Synced Delivery</span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3">
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#25D366] text-white text-title-md px-6 py-4 rounded-xl hover:opacity-95 transition-opacity shadow-md text-center"
            >
              <MessageCircle size={22} />
              <span>WhatsApp Overseas Concierge</span>
            </a>
            <Link
              to="/products/fresh-bouquets"
              className="bg-surface-container-lowest text-primary text-title-md px-6 py-4 rounded-xl hover:bg-surface-container transition-colors shadow-sm text-center"
            >
              Order for Colombo Delivery Now
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}