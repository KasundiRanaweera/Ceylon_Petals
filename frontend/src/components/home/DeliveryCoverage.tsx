import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, CheckCircle2 } from 'lucide-react'
import { useShop } from '../../hooks/useShop'
import { DISTRICTS } from '../../data/settings'
import { formatLKR } from '../../lib/format'
import { formatClock } from '../../lib/dates'
import { laterDistricts, listWords, lowestFee, sameDayDistricts } from '../../lib/shopInfo'


// Checks the customer's district against the delivery zones the owner sets in Settings.
export default function DeliveryCoverage() {
  const shop = useShop()
  const [district, setDistrict] = useState('')
  const zone = shop.deliveryZones.find((z) => z.active && z.district === district)
  // Everything below comes from the delivery zones in Admin -> Settings.
  const sameDay = sameDayDistricts(shop)
  const later = laterDistricts(shop)
  const fromFee = lowestFee(shop)
  const coverage = [
    sameDay.length > 0 && `Same-day to ${listWords(sameDay)} for orders before ${formatClock(shop.sameDayCutoff)}`,
    later.length > 0 && `Next-day to ${listWords(later)}`,
    shop.freeDeliveryOver > 0 && `Free delivery on orders over ${formatLKR(shop.freeDeliveryOver)}`,
  ].filter((line): line is string => Boolean(line))

  return (
    <section className="w-full py-20 lg:py-28 bg-surface-container-low">
      <div className="max-w-7xl mx-auto px-4 lg:px-12">
        <div className="rounded-xl bg-surface-container-lowest ring-1 ring-outline-variant/40 shadow-[0_18px_40px_-28px_rgba(48,48,48,0.35)] p-6 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.22em] text-tertiary">
                <MapPin size={18} />
                <span>Islandwide delivery</span>
              </div>
              <h2 className="font-display text-[clamp(2rem,4vw,3rem)] leading-tight text-on-surface">
                {sameDay.length > 0 ? `Same-day across ${listWords(sameDay)}` : 'Delivered across Sri Lanka'}
              </h2>
              <p className="text-[15px] text-on-surface-variant leading-relaxed">
                Hand-delivered by our own team, with a call to the recipient on arrival and a free handwritten card.
              </p>

              <div className="space-y-2 pt-1">
                {coverage.map((line) => (
                  <div key={line} className="flex items-center gap-2 text-title-md text-on-surface">
                    <CheckCircle2 size={20} className="text-tertiary shrink-0" />
                    <span>{line}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3">
                <label htmlFor="coverage-district" className="block text-[11px] text-tertiary uppercase tracking-[0.18em] mb-2">
                  Check delivery to your district
                </label>
                <select
                  id="coverage-district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full bg-surface-container-low px-4 py-2.5 rounded-lg text-body-md text-on-surface ring-1 ring-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                >
                  <option value="">Select your district</option>
                  {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                </select>
                {district && (
                  <p className={`text-body-sm font-medium mt-2 ${zone?.sameDay ? 'text-emerald-800' : 'text-on-surface'}`} aria-live="polite">
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
              <div className="relative bg-surface-container-low rounded-xl ring-1 ring-outline-variant/40 p-3">
                <div
                  className="w-full h-80 rounded-lg bg-cover bg-center relative overflow-hidden"
                  style={{
                    backgroundImage:
                      "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDf-WUlqCYIvSdchj307iXMXLEkuCRgWLopfcVljQBMObJwsp90wc7LuwOYKKTod8HqLkybA0rf_LOh4OgpQlVUM9yurbYbhOke3vBZHLEkLvNa6xCnyhC2e6H31PnyXg_7WMMr29kGBxWSO6xKuovFA_pKPnrWKh4eQ1tZUmDA-7gnbU9I_Z2dyztySzy1wb_ShMgmoplUKjK_pt6IstrARZH-unlQfbDvZ_mrRLxtnesLLFolycNepw=w1408')",
                  }}
                >
                  <div className="absolute inset-0 bg-primary/20" />
                  <div className="absolute top-8 left-8 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm text-on-surface text-xs font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#d4af37]" /> {sameDay.length > 0 ? `Same-day: ${listWords(sameDay)}` : 'Islandwide delivery'}
                  </div>
                  <div className="absolute bottom-10 right-8 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm text-on-surface text-xs font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#d4af37]" /> Order before {formatClock(shop.sameDayCutoff)}
                  </div>
                  <div className="absolute top-1/2 left-1/3 bg-primary text-[#e9c349] px-3 py-1 rounded-full shadow-lg text-xs font-semibold flex items-center gap-1">
                    <MapPin size={14} /> Our studio
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-surface-container-lowest ring-1 ring-outline-variant/40 rounded-lg">
                    <span className="font-display text-headline-sm text-tertiary block">{shop.deliveryZones.filter((z) => z.active).length}</span>
                    <span className="text-body-sm text-on-surface-variant">Districts we deliver to</span>
                  </div>
                  <div className="p-3 bg-surface-container-lowest ring-1 ring-outline-variant/40 rounded-lg">
                    <span className="font-display text-headline-sm text-tertiary block">{fromFee === null ? '—' : formatLKR(fromFee)}</span>
                    <span className="text-body-sm text-on-surface-variant">Delivery from</span>
                  </div>
                  <div className="p-3 bg-surface-container-lowest ring-1 ring-outline-variant/40 rounded-lg">
                    <span className="font-display text-headline-sm text-tertiary block">{formatClock(shop.sameDayCutoff)}</span>
                    <span className="text-body-sm text-on-surface-variant">Same-day cut-off</span>
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
