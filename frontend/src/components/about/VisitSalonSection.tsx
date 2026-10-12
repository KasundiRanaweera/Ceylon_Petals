import { Home as HomeIcon, MapPin, Clock, MessageCircle, Phone, Landmark } from 'lucide-react'
import { useShop, useWhatsApp } from '../../hooks/useShop'

const EXPERIENCES = ['Bridal Poruwa Consult', 'Custom Arrangement Ideas', 'Corporate Orders']

export default function VisitSalonSection() {
  const whatsapp = useWhatsApp()
  const shop = useShop()
  const link = whatsapp('Hello, I would like to book a visit to your studio')

  return (
    <section id="visit" className="w-full py-20 bg-primary text-on-primary relative overflow-hidden scroll-mt-36">
      <div className="max-w-7xl mx-auto px-4 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-sm bg-surface/10 backdrop-blur-md">
              <HomeIcon size={16} className="text-tertiary-fixed" />
              <span className="text-[11px] text-surface tracking-widest uppercase">Visit Our Studio</span>
            </div>
            <h2 className="font-display text-display-lg text-on-primary font-light">
              Come See Us in Colombo
            </h2>
            <p className="text-body-md text-surface-variant leading-relaxed">
              Step into our Colombo studio, see fresh arrivals from the highlands, and talk
              through your wedding Poruwa, a custom arrangement, or an order for your business
              with our team.
            </p>
            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-3">
                <MapPin size={20} className="text-tertiary-fixed mt-1" />
                <div>
                  <span className="text-title-md text-on-primary block">{shop.address}</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock size={20} className="text-tertiary-fixed mt-1" />
                <div>
                  <span className="text-title-md text-on-primary block">Studio Hours</span>
                  <span className="text-body-sm text-surface-variant">{shop.openingHours}</span>
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
              <a href={`tel:${shop.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 text-label-md text-surface-variant hover:text-on-primary transition-colors">
                <Phone size={18} />
                {shop.phone}
              </a>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <div className="bg-surface-container-lowest text-on-surface rounded-xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-secondary uppercase">Our Studio</span>
                  <h3 className="font-display text-headline-sm text-primary">Alfred House Gardens</h3>
                </div>
                <Landmark size={28} className="text-primary" />
              </div>
              <div
                className="w-full h-56 bg-cover bg-center rounded-lg shadow-inner flex items-end p-3"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBx8asNL_a8QlcH0WI7mVvS0k94jEthl705AbJCcrlbm_ertkgB_pPtW4m0sqyKEyVSHXsfAcGk2K5fl3BmlhavWpR0hAX8ga8bEoy26TPUg0zNYeRDdPRQN8KGtY1aa9m1djG1zPHQV7gRANW02HLg2EyiTiagybgHXx4BOpjQW-Qx7P8p2uXgeCSydFka5mQyiPHCXHh4yNhVuT4iTEGnlzOhoUkLHZGpVg4dbginBW9JWbQgaV0LnQ=w1408')",
                }}
              >
                <div className="px-3 py-1 rounded bg-primary/80 backdrop-blur-md text-on-primary text-[11px] flex items-center gap-1">
                  <MapPin size={14} />
                  Colombo 03
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-[11px] text-secondary uppercase block">What You Can Book</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {EXPERIENCES.map((exp) => (
                    <div key={exp} className="p-2 rounded bg-surface-container text-center text-[11px] text-primary">
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