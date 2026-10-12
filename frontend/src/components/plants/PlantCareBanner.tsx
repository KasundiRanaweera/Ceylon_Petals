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
    <section className="px-4 lg:px-12 py-20 bg-surface">
      <div className="max-w-7xl mx-auto">
        <div className="relative bg-primary text-on-primary rounded-2xl overflow-hidden shadow-xl p-8 lg:p-16">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-container via-primary to-primary-container opacity-90" />
          <div className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full bg-tertiary-container/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 bg-surface-container-lowest/15 backdrop-blur-md px-4 py-1 rounded-sm text-on-primary text-[11px]">
                <Leaf size={16} className="text-tertiary-fixed" />
                Plant Care Support
              </div>
              <h2 className="font-display text-headline-lg text-on-primary">
                Have a Struggling Plant or Need <span className="italic font-normal">Custom Styling Help</span>?
              </h2>
              <p className="text-body-lg text-surface-container-highest max-w-2xl leading-relaxed">
                Our plant care team offers free WhatsApp leaf diagnostics, repotting help, and can
                advise on ongoing care for homes and offices across Colombo.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {OFFERS.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-2">
                    <Icon size={20} className="text-tertiary-fixed mt-0.5" />
                    <span className="text-body-sm text-surface-container-low">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-4 lg:items-end">
              <div className="bg-surface-container-lowest text-on-surface p-6 rounded-xl shadow-lg w-full max-w-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-[#25D366]/15 flex items-center justify-center text-[#25D366]">
                    <Send size={24} />
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-secondary block">Plant Care Line</span>
                    <span className="text-title-md text-primary font-bold">{formatPhone(whatsappNumber)}</span>
                  </div>
                </div>
                <p className="text-body-sm text-secondary mb-4">
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