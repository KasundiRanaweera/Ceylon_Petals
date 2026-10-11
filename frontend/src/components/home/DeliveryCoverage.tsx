import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, CheckCircle2 } from 'lucide-react'
import { useShop } from '../../hooks/useShop'
import { DISTRICTS } from '../../data/settings'
import { formatLKR } from '../../lib/format'
import { formatClock } from '../../lib/dates'

const COVERAGE_LIST = [
  'Colombo 01 – 15 and the Greater Colombo suburbs',
  'Dehiwala, Mount Lavinia, Rajagiriya, Nugegoda & Kotte',
  'Gampaha, Negombo & Kalutara on the same day',
  'Kandy, Galle and more on the next day',
]

// Checks the customer's district against the delivery zones the owner sets in Settings.
export default function DeliveryCoverage() {
  const shop = useShop()
  const [district, setDistrict] = useState('')
  const zone = shop.deliveryZones.find((z) => z.active && z.district === district)

  return (
    <section className="w-full py-14 bg-surface">
      <div className="max-w-7xl mx-auto px-4 lg:px-12">
        <div className="bg-surface-container rounded-2xl p-6 lg:p-10 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 text-tertiary text-[11px] uppercase tracking-wider">
                <MapPin size={18} />
                <span>Express Islandwide Fleet</span>
              </div>
              <h2 className="font-display text-headline-lg text-primary">
                Colombo Metro &amp; Suburbs Express Coverage
              </h2>
              <p className="text-body-md text-secondary leading-relaxed">
                Every arrangement travels in custom climate-conditioned floristry vans to preserve
                petal hydration under tropical temperatures.
              </p>

              <div className="space-y-2 pt-1">
                {COVERAGE_LIST.map((line) => (
                  <div key={line} className="flex items-center gap-2 text-title-md text-primary">
                    <CheckCircle2 size={20} className="text-emerald-700" />
                    <span>{line}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3">
                <label htmlFor="coverage-district" className="block text-[11px] text-secondary uppercase tracking-wider mb-2">
                  Check delivery to your district
                </label>
                <select
                  id="coverage-district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full bg-surface-container-lowest px-4 py-2.5 rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select your district</option>
                  {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                </select>
                {district && (
                  <p className={`text-body-sm font-medium mt-2 ${zone?.sameDay ? 'text-emerald-800' : 'text-primary'}`} aria-live="polite">
                    {!zone
                      ? <>We don't deliver to {district} online yet — <Link to="/delivery" className="underline">message us</Link> and we'll try to help.</>
                      : zone.sameDay
                        ? `Same-day delivery to ${district} for orders before ${formatClock(shop.sameDayCutoff)}. Delivery fee ${formatLKR(zone.fee)}.`
                        : `Next-day delivery to ${district}. Delivery fee ${formatLKR(zone.fee)}.`}
                  </p>
                )}
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="relative bg-surface-container-lowest rounded-xl p-4 shadow-md">
                <div
                  className="w-full h-80 rounded-lg bg-cover bg-center relative overflow-hidden"
                  style={{
                    backgroundImage:
                      "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDf-WUlqCYIvSdchj307iXMXLEkuCRgWLopfcVljQBMObJwsp90wc7LuwOYKKTod8HqLkybA0rf_LOh4OgpQlVUM9yurbYbhOke3vBZHLEkLvNa6xCnyhC2e6H31PnyXg_7WMMr29kGBxWSO6xKuovFA_pKPnrWKh4eQ1tZUmDA-7gnbU9I_Z2dyztySzy1wb_ShMgmoplUKjK_pt6IstrARZH-unlQfbDvZ_mrRLxtnesLLFolycNepw=w1408')",
                  }}
                >
                  <div className="absolute inset-0 bg-primary/20" />
                  <div className="absolute top-8 left-8 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm text-primary text-xs font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Colombo 03 &amp; 07: 60-Min Express
                  </div>
                  <div className="absolute bottom-10 right-8 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm text-primary text-xs font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Battaramulla &amp; Suburbs: 2-3 Hrs
                  </div>
                  <div className="absolute top-1/2 left-1/3 bg-primary text-on-primary px-3 py-1 rounded-sm shadow-lg text-xs font-bold flex items-center gap-1">
                    <MapPin size={14} /> Our Colombo studio
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-surface-container-low rounded-lg">
                    <span className="font-display text-headline-sm text-primary block">100%</span>
                    <span className="text-body-sm text-secondary">Temperature Controlled</span>
                  </div>
                  <div className="p-2 bg-surface-container-low rounded-lg">
                    <span className="font-display text-headline-sm text-primary block">3 Hrs</span>
                    <span className="text-body-sm text-secondary">Average Handover</span>
                  </div>
                  <div className="p-2 bg-surface-container-low rounded-lg">
                    <span className="font-display text-headline-sm text-primary block">SMS/Photo</span>
                    <span className="text-body-sm text-secondary">Proof of Delivery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
