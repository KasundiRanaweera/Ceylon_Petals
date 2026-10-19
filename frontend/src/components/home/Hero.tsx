import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { EASE_OUT } from '../motion/variants'
import { useShop } from '../../hooks/useShop'
import { formatClock } from '../../lib/dates'
import { SITE_IMAGES } from '../../data/siteImages'
import { sizedImage } from '../../lib/images'

// The first screen. The shop's name, set huge, is the picture's title: it sits over one of our own
// arrangements (the Grand Botanical Collection, in a colonial Colombo room), and its last line fades
// into the flowers, so the letters seem to stand behind the arrangement.
// Bottom left: this month in the studio, with the real delivery districts and cut-off.
// Bottom right: a card for custom orders.
// One load sequence (the photo settles, the name rises line by line, then the details), and as you
// scroll the name lifts away faster than the photo for a little depth.

const PHOTO = '/images/home/grand-botanical-1408.webp'
const FEATURED = { slug: 'grand-botanical-collection', name: 'Grand Botanical Collection' }

function listJoin(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

function PhotoCredit({ className = '' }: { className?: string }) {
  return (
    <Link
      to={`/product/${FEATURED.slug}`}
      className={`group inline-flex min-h-[44px] items-center gap-1.5 text-[13px] text-white/75 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${className}`}
    >
      In the photo: <span className="underline decoration-[#d4af37] underline-offset-4">{FEATURED.name}</span>
      <ArrowUpRight size={15} aria-hidden="true" className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  )
}

export default function Hero() {
  const reduce = useReducedMotion()
  const shop = useShop()
  const section = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end start'] })
  const photoY = useTransform(scrollYProgress, [0, 1], ['0%', '14%'])
  const nameY = useTransform(scrollYProgress, [0, 1], ['0%', '-45%'])
  const nameOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0])

  const month = new Intl.DateTimeFormat('en-GB', { month: 'long', timeZone: 'Asia/Colombo' }).format(new Date())
  const sameDay = shop.deliveryZones.filter((z) => z.active && z.sameDay).map((z) => z.district)
  const nameLines = shop.shopName.trim().split(/\s+/)

  return (
    <section
      ref={section}
      aria-labelledby="home-hero-title"
      className="relative isolate flex min-h-[calc(100svh-101px)] w-full flex-col overflow-hidden bg-[#1b1c1c] text-[#fffdf9] lg:min-h-[calc(100svh-109px)]"
    >
      {/* the photo: settles from a slow zoom on load, then drifts with the scroll */}
      <motion.div aria-hidden="true" className="absolute inset-0 -z-10" style={reduce ? undefined : { y: photoY }}>
        <motion.img
          src={PHOTO}
          alt=""
          fetchPriority="high"
          initial={{ opacity: 0, scale: 1.16 }}
          animate={{ opacity: 1, scale: 1.06 }}
          transition={{ duration: 1.8, ease: EASE_OUT }}
          className="h-full w-full object-cover object-[24%_50%] lg:object-[30%_42%]"
        />
      </motion.div>
      {/* shade: darker at the top for the name and at the bottom for the details */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(20,18,17,0.62)_0%,rgba(20,18,17,0.18)_38%,rgba(20,18,17,0.3)_62%,rgba(20,18,17,0.82)_100%)]" />

      {/* on large screens the photo credit sits in the top corner, out of the way of the name */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.3 }}
        className="absolute right-12 top-4 z-10 hidden lg:block"
      >
        <PhotoCredit />
      </motion.div>

      {/* the name: each line rises from behind a mask; the last line fades into the flowers */}
      <motion.h1
        id="home-hero-title"
        style={reduce ? undefined : { y: nameY, opacity: nameOpacity }}
        className="hero-wordmark relative mx-auto w-full max-w-[1400px] px-4 pt-8 font-display font-normal uppercase leading-[0.86] tracking-[0.01em] text-[#f6efe6] sm:pt-10 lg:px-12 lg:pt-8"
      >
        {nameLines.map((line, i) => (
          <span
            key={line + i}
            className={`block overflow-hidden pb-[0.04em] text-[clamp(4.25rem,17vw,8.5rem)] lg:text-[clamp(8rem,12.2vw,13rem)] ${
              nameLines.length > 1 && i === nameLines.length - 1 ? 'text-right' : ''
            }`}
          >
            <motion.span
              className="inline-block"
              initial={{ y: '105%' }}
              animate={{ y: '0%' }}
              transition={{ type: 'spring', bounce: 0, visualDuration: 0.95, delay: 0.35 + i * 0.16 }}
            >
              {line}
            </motion.span>
          </span>
        ))}
      </motion.h1>

      <div className="relative mx-auto mt-auto grid w-full max-w-[1400px] grid-cols-1 items-end gap-8 px-4 pb-8 pt-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16 lg:px-12 lg:pb-10 lg:pt-6">
        {/* this month in the studio */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1, ease: EASE_OUT }}
          className="max-w-2xl"
        >
          <p className="font-display text-[clamp(2.5rem,5vw,4rem)] uppercase leading-none tracking-[0.02em] text-[#f6efe6]">{month}</p>
          <p className="mt-3 max-w-xl text-[16px] leading-[1.7] text-white/85 sm:text-[17px]">
            Fresh in our Colombo studio this month: highland roses, island orchids and tropical stems, arranged by hand.
            {shop.acceptingOrders && sameDay.length > 0 && (
              <>
                {' '}
                Same-day delivery to {sameDay.length > 3 ? `${sameDay.length} districts` : listJoin(sameDay)} when you order by{' '}
                {formatClock(shop.sameDayCutoff)}.
              </>
            )}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link to="/shop" className="hero-spring btn-gradient inline-flex min-h-[52px] items-center px-8">
              Shop flowers
            </Link>
            <Link
              to="/wedding-events"
              className="hero-spring inline-flex min-h-[52px] items-center rounded-lg border border-white/35 bg-white/10 px-7 text-[15px] tracking-[0.04em] text-white backdrop-blur-md hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white"
            >
              Weddings &amp; Poruwa
            </Link>
          </div>
          <PhotoCredit className="mt-5 lg:hidden" />
        </motion.div>

        {/* custom orders */}
        <motion.aside
          aria-label="Custom orders"
          initial={{ opacity: 0, x: reduce ? 0 : 48 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', bounce: 0.18, visualDuration: 0.7, delay: 1.15 }}
          className="flex gap-4 rounded-xl bg-[#fffdf9]/95 p-3 text-on-surface shadow-[0_30px_60px_-30px_rgba(0,0,0,0.7)] ring-1 ring-white/40 backdrop-blur-md"
        >
          <img
            src={sizedImage(SITE_IMAGES.floristAtWork, 640)}
            alt="Our florist arranging roses in the Colombo studio"
            loading="lazy"
            className="h-auto w-28 shrink-0 rounded-lg object-cover sm:w-32"
          />
          <div className="flex min-w-0 flex-col justify-center py-1 pr-1">
            <h2 className="font-display text-[22px] leading-tight text-mauve">Custom orders</h2>
            <p className="mt-1.5 text-[14px] leading-snug text-on-surface-variant">
              Tell us the occasion, colours and budget, and we&rsquo;ll design it for you.
            </p>
            <Link
              to="/custom-order"
              className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 self-start text-[14px] font-medium text-tertiary underline decoration-[#d4af37] underline-offset-4 hover:text-on-surface"
            >
              Start a custom order
            </Link>
          </div>
        </motion.aside>
      </div>
    </section>
  )
}
