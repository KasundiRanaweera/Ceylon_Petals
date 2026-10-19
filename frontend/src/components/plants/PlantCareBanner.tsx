import { Leaf, Sparkles, TreeDeciduous, HeartPulse, Send } from 'lucide-react'
import { useShop, useWhatsApp } from '../../hooks/useShop'
import { formatPhone } from '../../lib/phone'

const OFFERS = [
  { icon: Sparkles, text: 'Organic compost available on request' },
  { icon: TreeDeciduous, text: 'Balcony and patio plant setup' },
  { icon: HeartPulse, text: 'Free WhatsApp plant health check' },
]

export default function PlantCareBanner() {
  const whatsapp = useWhatsApp()
  const { whatsappNumber } = useShop()
  const link = whatsapp('Hello, I need help with a plant care question')

  return (
    <section className="px-4 lg:px-12 py-20 lg:py-28 bg-surface">
      <div className="max-w-7xl mx-auto">
        <div className="relative bg-ink-gradient text-on-primary rounded-xl overflow-hidden shadow-[0_30px_60px_-30px_rgba(48,48,48,0.6)] p-8 lg:p-16">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-container/60 via-transparent to-transparent" />
          <div className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full bg-[#d4af37]/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-[11px] uppercase tracking-[0.22em] text-[#e9c349] ring-1 ring-[#e9c349]/30">
                <Leaf size={16} className="text-[#e9c349]" />
                Plant Care Support
              </div>
              <h2 className="font-display text-[clamp(2rem,4vw,3rem)] leading-tight text-white">
                Have a Struggling Plant or Need <span className="italic font-normal text-[#e9c349]">Custom Styling Help</span>?
              </h2>
              <p className="text-body-lg text-white/70 max-w-2xl leading-relaxed">
                Our plant care team offers free WhatsApp leaf diagnostics, repotting help, and can
                advise on ongoing care for homes and offices across Colombo.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {OFFERS.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-2">
                    <Icon size={20} className="text-[#e9c349] mt-0.5" />
                    <span className="text-body-sm text-white/70">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-4 lg:items-end">
              <div className="bg-surface-container-lowest text-on-surface p-6 rounded-xl ring-1 ring-white/10 shadow-[0_24px_50px_-24px_rgba(0,0,0,0.6)] w-full max-w-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-[#25D366]/15 flex items-center justify-center text-[#25D366]">
                    <Send size={24} />
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-[0.22em] text-tertiary block">Plant Care Line</span>
                    <span className="font-display text-title-md text-on-surface">{formatPhone(whatsappNumber)}</span>
                  </div>
                </div>
                <p className="text-body-sm text-on-surface-variant mb-4">
                  Send a photo of yellowing leaves or any care question for a quick assessment from our team.
                </p>
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#25D366] text-white py-3 px-4 rounded-lg text-label-md font-semibold flex items-center justify-center gap-2 hover:bg-[#20b859] transition-all shadow-md"
                >
                  <Send size={20} /> Message Our Plant Team
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}