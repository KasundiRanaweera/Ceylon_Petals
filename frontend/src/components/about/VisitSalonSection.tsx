import { Home as HomeIcon, MapPin, Clock, MessageCircle, Phone, Landmark } from 'lucide-react'
import { useShop, useWhatsApp } from '../../hooks/useShop'
import { studioArea } from '../../lib/shopInfo'

const EXPERIENCES = ['Bridal Poruwa Consult', 'Custom Arrangement Ideas', 'Corporate Orders']

export default function VisitSalonSection() {
  const whatsapp = useWhatsApp()
  const shop = useShop()
  const area = studioArea(shop.address)
  const link = whatsapp('Hello, I would like to book a visit to your studio')

  return (
    <section id="visit" className="w-full py-20 lg:py-28 bg-ink-gradient text-on-primary relative overflow-hidden scroll-mt-36">
      <div className="max-w-7xl mx-auto px-4 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/10 ring-1 ring-[#e9c349]/30">
              <HomeIcon size={16} className="text-[#e9c349]" />
              <span className="text-[11px] text-[#e9c349] tracking-[0.22em] uppercase">Visit Our Studio</span>
            </div>
            <h2 className="font-display text-[clamp(2rem,4vw,3rem)] leading-tight text-white">
              Come See Us{area ? ` in ${area}` : ''}
            </h2>
            <p className="text-[15px] text-white/70 leading-relaxed">
              Step into our studio, see fresh arrivals from the highlands, and talk
              through your wedding Poruwa, a custom arrangement, or an order for your business
              with our team.
            </p>
            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-3">
                <MapPin size={20} className="text-[#e9c349] mt-1" />
                <div>
                  <span className="text-title-md text-white block">{shop.address}</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock size={20} className="text-[#e9c349] mt-1" />
                <div>
                  <span className="text-title-md text-white block">Studio Hours</span>
                  <span className="text-body-sm text-white/70">{shop.openingHours}</span>
                </div>
              </div>
            </div>
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-lg text-title-md hover:opacity-90 transition-opacity shadow-md"
              >
                <MessageCircle size={20} />
                Book a Visit on WhatsApp
              </a>
              <a href={`tel:${shop.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 border-b border-white/40 pb-1 text-label-md text-white/70 hover:border-[#e9c349] hover:text-[#e9c349] transition-colors">
                <Phone size={18} />
                {shop.phone}
              </a>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <div className="bg-surface-container-lowest text-on-surface rounded-xl ring-1 ring-white/10 p-6 shadow-[0_24px_50px_-24px_rgba(0,0,0,0.6)] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-tertiary uppercase tracking-[0.18em]">Our Studio</span>
                  <h3 className="font-display text-headline-sm text-on-surface">{shop.address || shop.shopName}</h3>
                </div>
                <Landmark size={28} className="text-tertiary" />
              </div>
              <div
                className="w-full h-56 bg-cover bg-center rounded-lg flex items-end p-3"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBx8asNL_a8QlcH0WI7mVvS0k94jEthl705AbJCcrlbm_ertkgB_pPtW4m0sqyKEyVSHXsfAcGk2K5fl3BmlhavWpR0hAX8ga8bEoy26TPUg0zNYeRDdPRQN8KGtY1aa9m1djG1zPHQV7gRANW02HLg2EyiTiagybgHXx4BOpjQW-Qx7P8p2uXgeCSydFka5mQyiPHCXHh4yNhVuT4iTEGnlzOhoUkLHZGpVg4dbginBW9JWbQgaV0LnQ=w1408')",
                }}
              >
                <div className="px-3 py-1 rounded-full bg-primary/80 backdrop-blur-md text-white text-[11px] flex items-center gap-1">
                  <MapPin size={14} />
                  {area || 'Our studio'}
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-[11px] text-tertiary uppercase tracking-[0.18em] block">What You Can Book</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {EXPERIENCES.map((exp) => (
                    <div key={exp} className="p-2 rounded-lg bg-primary-fixed text-center text-[11px] text-on-primary-fixed">
                      {exp}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}