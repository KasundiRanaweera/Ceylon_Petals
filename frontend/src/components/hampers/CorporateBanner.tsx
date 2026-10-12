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
    <section className="w-full bg-primary-container text-on-primary py-14 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 bg-surface-container-lowest/10 px-3 py-1 rounded-sm">
              <Building2 size={16} className="text-tertiary-fixed" />
              <span className="text-[11px] tracking-widest uppercase text-tertiary-fixed">Corporate &amp; Diplomatic Accounts</span>
            </div>
            <h2 className="font-display text-display-lg text-on-primary tracking-tight leading-tight">
              Volume Gifting &amp; High-Profile Festivities
            </h2>
            <p className="text-body-lg text-on-primary-container max-w-xl">
              Whether rewarding an executive team, welcoming visiting delegations, or marking a
              company milestone, we coordinate bespoke hampers with custom branding and reliable
              courier dispatch.
            </p>
            <div className="flex flex-wrap gap-4 pt-1">
              {TRUST_POINTS.map((point) => (
                <div key={point} className="flex items-center gap-2 text-body-sm text-inverse-on-surface">
                  <BadgeCheck size={18} className="text-tertiary-fixed" /> {point}
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
                className="bg-surface-container-lowest/10 hover:bg-surface-container-lowest/20 text-on-primary px-6 py-3 rounded-lg text-title-md inline-flex items-center justify-center gap-2 transition-all"
              >
                <Download size={20} /> Request a corporate quote
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-surface-container-lowest/5 backdrop-blur-md p-6 rounded-2xl space-y-4">
              <span className="font-display text-headline-sm text-tertiary-fixed block">What We Offer</span>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-surface-container-lowest/10 rounded-xl">
                  <span className="text-display-lg text-on-primary font-bold block">100%</span>
                  <span className="text-body-sm text-on-primary-container block mt-1">Freshness Guarantee on Handover</span>
                </div>
                <div className="p-3 bg-surface-container-lowest/10 rounded-xl">
                  <span className="text-headline-md text-on-primary font-bold block">Flexible</span>
                  <span className="text-body-sm text-on-primary-container block mt-1">Volume Orders, Scaled to Your Event</span>
                </div>
              </div>
              <div className="p-4 bg-surface-container-lowest/10 rounded-xl flex items-center gap-4">
                <Phone size={32} className="text-tertiary-fixed" />
                <div>
                  <span className="text-[11px] text-on-primary-container block">DIRECT CORPORATE DESK</span>
                  <span className="text-title-md text-on-primary">{phone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}