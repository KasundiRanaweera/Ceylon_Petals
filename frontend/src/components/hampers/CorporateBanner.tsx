import { Building2, BadgeCheck, MessageCircle, Download, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useShop, useWhatsApp } from '../../hooks/useShop'

const TRUST_POINTS = [
  'Tax Invoicing & Credit Facilities',
  'Custom Ribbon Screen Printing',
  'Islandwide Priority Handover',
]

export default function CorporateBanner() {
  const whatsapp = useWhatsApp()
  const { phone } = useShop()
  const link = whatsapp('Hello, I would like to enquire about corporate gifting hampers')

  return (
    <section className="w-full bg-ink-gradient text-on-primary py-20 lg:py-28 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 ring-1 ring-[#e9c349]/30">
              <Building2 size={16} className="text-[#e9c349]" />
              <span className="text-[11px] tracking-[0.22em] uppercase text-[#e9c349]">Corporate &amp; Diplomatic Accounts</span>
            </div>
            <h2 className="font-display text-[clamp(2rem,4vw,3rem)] leading-tight text-white">
              Volume Gifting &amp; High-Profile Festivities
            </h2>
            <p className="text-body-lg text-white/70 max-w-xl">
              Whether rewarding an executive team, welcoming visiting delegations, or marking a
              company milestone, we coordinate bespoke hampers with custom branding and reliable
              courier dispatch.
            </p>
            <div className="flex flex-wrap gap-4 pt-1">
              {TRUST_POINTS.map((point) => (
                <div key={point} className="flex items-center gap-2 text-body-sm text-white/70">
                  <BadgeCheck size={18} className="text-[#e9c349]" /> {point}
                </div>
              ))}
            </div>
            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#25D366] hover:bg-[#1ebd5a] text-white px-6 py-3 rounded-lg text-title-md inline-flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <MessageCircle size={24} /> WhatsApp Corporate Concierge
              </a>
              <Link
                to="/custom-order?type=corporate"
                className="border border-[#d4af37] text-[#e9c349] hover:bg-[#d4af37] hover:text-on-tertiary-container px-6 py-3 rounded-lg text-title-md inline-flex items-center justify-center gap-2 transition-all"
              >
                <Download size={20} /> Request a corporate quote
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white/5 backdrop-blur-md p-6 rounded-xl ring-1 ring-white/10 space-y-4">
              <span className="font-display text-headline-sm text-[#e9c349] block">What We Offer</span>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/5 rounded-lg ring-1 ring-white/10">
                  <span className="font-display text-display-lg text-[#e9c349] block">100%</span>
                  <span className="text-body-sm text-white/70 block mt-1">Freshness Guarantee on Handover</span>
                </div>
                <div className="p-3 bg-white/5 rounded-lg ring-1 ring-white/10">
                  <span className="font-display text-headline-md text-[#e9c349] block">Flexible</span>
                  <span className="text-body-sm text-white/70 block mt-1">Volume Orders, Scaled to Your Event</span>
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg ring-1 ring-white/10 flex items-center gap-4">
                <Phone size={32} className="text-[#e9c349]" />
                <div>
                  <span className="text-[11px] tracking-[0.22em] text-white/70 block">DIRECT CORPORATE DESK</span>
                  <span className="font-display text-title-md text-white">{phone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}