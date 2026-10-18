import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowUpRight, Clock, Gift, Globe2, MapPin, MessageCircle, PackageSearch } from 'lucide-react'
import { fadeUp, staggerContainer } from '../motion/variants'
import { useShop, useWhatsApp } from '../../hooks/useShop'
import { useCutoffCountdown } from '../../hooks/useCutoffCountdown'
import { formatClock } from '../../lib/dates'
import { formatLKR } from '../../lib/format'
import { listWords } from '../../lib/shopInfo'
import { sizedImage } from '../../lib/images'
import { PRODUCT_IMAGES } from '../../data/productImages'
import { SITE_IMAGES } from '../../data/siteImages'

// "Only at Ceylon Petals": the things this shop does that an ordinary flower shop does not.
// Every tile is a real feature of the site, and the live details (cut-off, same-day districts,
// free-delivery threshold) come from the owner's Settings, so they are always true.

function formatLeft(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h === 0 ? `${m} min` : m === 0 ? `${h} h` : `${h} h ${m} min`
}

interface TileProps {
  /** Grid size of this tile. */
  span?: string
  to?: string
  href?: string
  className?: string
  children: ReactNode
  label: string
}

// The whole tile is one link (one tab stop, one clear name for screen readers).
function Tile({ span = '', to, href, className = '', children, label }: TileProps) {
  const cls = `group relative isolate flex h-full flex-col overflow-hidden rounded-3xl p-6 sm:p-7 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_30px_50px_-30px_rgba(12,10,9,0.55)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary motion-reduce:hover:translate-y-0 ${className}`
  return (
    <motion.li variants={fadeUp} className={`h-full ${span}`}>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={cls}>
          {children}
        </a>
      ) : (
        <Link to={to ?? '/'} aria-label={label} className={cls}>
          {children}
        </Link>
      )}
    </motion.li>
  )
}

const Arrow = ({ light = false }: { light?: boolean }) => (
  <span
    aria-hidden="true"
    className={`ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:rotate-45 ${
      light ? 'bg-white/15 text-white' : 'bg-white/80 text-primary'
    }`}
  >
    <ArrowUpRight size={18} />
  </span>
)

export default function SignatureBento() {
  const shop = useShop()
  const whatsapp = useWhatsApp()
  const left = useCutoffCountdown(shop.sameDayCutoff)
  const sameDayZones = shop.deliveryZones.filter((z) => z.active && z.sameDay).map((z) => z.district)
  const allZones = shop.deliveryZones.filter((z) => z.active).length
  const sameDayOpen = shop.acceptingOrders && sameDayZones.length > 0 && left !== null

  return (
    <section aria-labelledby="signature-title" className="bg-surface py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-12">
        <div className="mb-10 flex flex-col gap-4 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow flex items-center gap-3 font-bold text-[#7a4f05]">
              <span className="rule-dawn w-10" aria-hidden="true" /> Only at {shop.shopName}
            </p>
            <h2 id="signature-title" className="mt-4 font-display text-[clamp(2rem,4vw,3.25rem)] leading-[1.08] text-primary">
              More than a flower shop. <em className="font-normal italic text-tertiary">A Sri Lankan gifting studio.</em>
            </h2>
          </div>
          <p className="max-w-md text-body-md text-secondary">
            Live same-day delivery, hampers you design yourself, Poruwa florals and a florist on WhatsApp, all in one place.
          </p>
        </div>

        <motion.ul
          className="grid auto-rows-[minmax(190px,auto)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:gap-5"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          variants={staggerContainer(0.07)}
        >
          {/* 1. Live same-day delivery (the big tile) */}
          <Tile span="sm:col-span-2 lg:col-span-7 lg:row-span-2" to="/shop" label="Same-day delivery: shop flowers" className="bg-aurora">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-tertiary shadow-sm">
                  <Clock size={22} aria-hidden="true" />
                </span>
                <Arrow />
              </div>
              <div className="mt-auto pt-10">
                <p className="eyebrow text-[#7a4f05]">Live from our Colombo studio</p>
                <p className="mt-3 font-display text-[clamp(2rem,4.2vw,3.5rem)] leading-[1.02] text-primary">
                  {sameDayOpen ? (
                    <>
                      Order in the next <span className="italic text-tertiary">{formatLeft(left)}</span>, delivered today.
                    </>
                  ) : shop.acceptingOrders ? (
                    <>
                      Order now for <span className="italic text-tertiary">tomorrow</span>.
                    </>
                  ) : (
                    <>Online orders are paused. Message us on WhatsApp.</>
                  )}
                </p>
                <p className="mt-4 max-w-lg text-body-md text-on-surface-variant">
                  Same-day orders close at {formatClock(shop.sameDayCutoff)} Sri Lanka time
                  {sameDayZones.length > 0 && <> in {listWords(sameDayZones)}</>}. We deliver to {allZones} districts
                  {shop.freeDeliveryOver > 0 && <>, free over {formatLKR(shop.freeDeliveryOver)}</>}.
                </p>
                {sameDayZones.length > 0 && (
                  <ul className="mt-5 flex flex-wrap gap-2" aria-label="Same-day districts">
                    {sameDayZones.map((d) => (
                      <li key={d} className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-[13px] font-medium text-primary">
                        <MapPin size={13} className="text-tertiary" aria-hidden="true" /> {d}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Tile>

          {/* 2. Build your own hamper (photo tile) */}
          <Tile span="lg:col-span-5" to="/products/luxury-hampers#build-hamper" label="Build your own hamper" className="bg-[#1c1410] text-white">
              <img
                src={sizedImage(PRODUCT_IMAGES['velvet-bloom-and-chocolate-box'], 900)}
                alt=""
                loading="lazy"
                className="absolute inset-0 -z-10 h-full w-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0c0a09] via-[#0c0a09]/55 to-transparent" aria-hidden="true" />
              <div className="flex items-start">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                  <Gift size={20} aria-hidden="true" />
                </span>
                <Arrow light />
              </div>
              <div className="mt-auto pt-16">
                <p className="font-display text-headline-md">Design your own hamper</p>
                <p className="mt-1 text-body-sm text-white/85">Pick the flowers, treats and a keepsake. We price it and build it fresh.</p>
              </div>
            </Tile>

          {/* 3. Poruwa & weddings (dusk tile) */}
          <Tile span="lg:col-span-5" to="/wedding-events" label="Poruwa and wedding florals" className="bg-ink-gradient text-white">
              <img
                src={sizedImage(SITE_IMAGES.weddingPoruwa, 900)}
                alt=""
                loading="lazy"
                className="absolute inset-y-0 right-0 -z-10 h-full w-1/2 object-cover opacity-60 [mask-image:linear-gradient(to_left,black_40%,transparent)] transition-transform duration-700 group-hover:scale-105"
              />
              <div className="flex items-start">
                <span className="eyebrow rounded-full bg-white/10 px-3 py-1.5 text-[#f5d27a]">Weddings</span>
                <Arrow light />
              </div>
              <div className="mt-auto max-w-[60%] pt-14">
                <p className="font-display text-headline-md">Poruwa &amp; wedding florals</p>
                <p className="mt-1 text-body-sm text-white/80">Lotus, jasmine and orchid Poruwa stages, designed with you.</p>
              </div>
            </Tile>

          {/* 4. Send from abroad */}
          <Tile span="lg:col-span-4" to="/shop" label="Send flowers from abroad" className="bg-dawn-soft border border-[#f3dcc2]">
              <div className="flex items-start">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-tertiary shadow-sm">
                  <Globe2 size={20} aria-hidden="true" />
                </span>
                <Arrow />
              </div>
              <div className="mt-auto pt-10">
                <p className="font-display text-headline-sm text-primary">Sending from abroad?</p>
                <p className="mt-1 text-body-sm text-on-surface-variant">Pay by any card through PayHere. We send updates to your WhatsApp, wherever you are.</p>
              </div>
            </Tile>

          {/* 5. A florist on WhatsApp */}
            <Tile
              span="lg:col-span-4"
              href={whatsapp(`Hello ${shop.shopName}! Could a florist help me choose something?`)}
              label="Ask a florist on WhatsApp"
              className="bg-[#1c1410] text-white"
            >
              <div className="absolute -right-10 -top-10 -z-10 h-40 w-40 rounded-full bg-[#25D366]/25 blur-2xl" aria-hidden="true" />
              <div className="flex items-start">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#25D366] text-white">
                  <MessageCircle size={20} aria-hidden="true" />
                </span>
                <Arrow light />
              </div>
              <div className="mt-auto pt-10">
                <p className="font-display text-headline-sm">A florist on WhatsApp</p>
                <p className="mt-1 text-body-sm text-white/80">Tell us who it is for. We suggest, photograph and confirm before we send.</p>
              </div>
            </Tile>

          {/* 6. Track every order */}
          <Tile span="sm:col-span-2 lg:col-span-4" to="/track-order" label="Track your order" className="bg-surface-container-lowest border border-outline-variant/70">
              <div className="flex items-start">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-container text-primary">
                  <PackageSearch size={20} aria-hidden="true" />
                </span>
                <Arrow />
              </div>
              <div className="mt-auto pt-10">
                <p className="font-display text-headline-sm text-primary">Follow it to the door</p>
                <p className="mt-1 text-body-sm text-on-surface-variant">Track any order with its number and your phone. No account needed.</p>
              </div>
            </Tile>
        </motion.ul>
      </div>
    </section>
  )
}
