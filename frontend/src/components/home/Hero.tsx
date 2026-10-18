import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Leaf, PenLine, Truck } from 'lucide-react'
import WhatsAppIcon from '../ui/WhatsAppIcon'
import { EASE_OUT, fadeUp, pressable, staggerContainer } from '../motion/variants'
import { useWhatsApp, useShop } from '../../hooks/useShop'
import { useCutoffCountdown } from '../../hooks/useCutoffCountdown'
import { listProducts } from '../../services/catalog'
import { getSettings } from '../../services/shop'
import { formatClock } from '../../lib/dates'
import { formatLKR } from '../../lib/format'
import { imageSrcSet, sizedImage } from '../../lib/images'
import { effectivePrice } from '../../lib/pricing'
import type { Product } from '../../types'

const MotionLink = motion.create(Link)

// Full-width wall of pink peonies (CC0, Mira Bozhko via Wikimedia Commons), stored at 1280 / 1920 /
// 2560 px. To use your own licensed photo, save it as flower-wall-1280/1920/2560.webp in public/images/hero.
const HERO_PHOTO = '/images/hero/flower-wall'

// The occasions people shop for most. Each opens the shop already filtered.
const QUICK_OCCASIONS = [
  { slug: 'birthday', label: 'Birthday' },
  { slug: 'anniversary', label: 'Anniversary' },
  { slug: 'love', label: 'Love' },
  { slug: 'sympathy', label: 'Sympathy' },
  { slug: 'wedding', label: 'Wedding' },
]

const PROMISES = [
  { icon: Truck, label: 'Same-day in Colombo' },
  { icon: PenLine, label: 'Free handwritten card' },
  { icon: Leaf, label: 'Freshness guaranteed' },
]

function formatCountdown(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

// One live line that tells the visitor what ordering today means, from the shop's own settings
// (cut-off time, whether orders are open) and the real Colombo clock.
// Whether same-day delivery to Colombo is on offer right now, from the shop's settings.
function offersSameDay(shop: ReturnType<typeof useShop>): boolean {
  return shop.acceptingOrders && (shop.deliveryZones.find((z) => z.district === 'Colombo')?.sameDay ?? false)
}

function DeliveryStatus() {
  const shop = useShop()
  // Same query (and cache) as useShop: we only need to know whether the real settings have arrived.
  const { isSuccess } = useQuery({ queryKey: ['settings'], queryFn: getSettings, staleTime: 5 * 60_000 })
  const left = useCutoffCountdown(shop.sameDayCutoff)
  const sameDay = offersSameDay(shop)

  let tone = 'bg-emerald-600'
  let text: string
  let short: string // phones: one line
  if (!shop.acceptingOrders) {
    tone = 'bg-amber-500'
    text = 'Online orders are paused. Message us on WhatsApp.'
    short = 'Online orders paused. WhatsApp us.'
  } else if (sameDay && left !== null) {
    text = `Order within ${formatCountdown(left)} for same-day delivery in Colombo`
    short = `Same-day in Colombo: ${formatCountdown(left)} left`
  } else if (sameDay) {
    text = `Order now, delivered from tomorrow (same-day orders close at ${formatClock(shop.sameDayCutoff)})`
    short = 'Order now for delivery tomorrow'
  } else {
    text = 'Order now, delivered from tomorrow'
    short = 'Order now for delivery tomorrow'
  }

  return (
    // Keeps its space but stays invisible until the shop's real settings load, so it never shows a guess.
    <p
      aria-hidden={!isSuccess}
      className={`inline-flex max-w-full items-center gap-2.5 rounded-full border border-outline-variant bg-white/80 py-2 pl-3 pr-4 text-[13px] font-medium text-primary shadow-sm backdrop-blur-sm sm:text-[14px] ${isSuccess ? '' : 'invisible'}`}
    >
      <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:hidden ${tone}`} />
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${tone}`} />
      </span>
      <span className="sm:hidden lg:inline xl:hidden">{short}</span>
      <span className="hidden sm:inline lg:hidden xl:inline">{text}</span>
    </p>
  )
}

// A real product from the shop, in its own space (name and price sit below the photo, never on it).
function ProductTile({ product, className = '' }: { product: Product; className?: string }) {
  return (
    <Link
      to={`/product/${product.slug}`}
      className={`group flex min-h-0 flex-col gap-3 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary ${className}`}
    >
      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl bg-surface-container shadow-[0_24px_40px_-28px_rgba(28,25,23,0.55)]">
        <img
          src={sizedImage(product.images[0], 640)}
          srcSet={imageSrcSet(product.images[0])}
          sizes="(min-width: 1024px) 22vw, 44vw"
          alt=""
          loading="eager"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none"
        />
      </div>
      <div className="flex items-baseline justify-between gap-3 px-0.5">
        <span className="truncate text-[14px] font-medium text-primary group-hover:underline">{product.name}</span>
        <span className="shrink-0 text-[14px] font-semibold text-tertiary">{formatLKR(effectivePrice(product))}</span>
      </div>
    </Link>
  )
}

function TileSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3" aria-hidden="true">
      <div className="min-h-0 flex-1 animate-pulse rounded-2xl bg-surface-container motion-reduce:animate-none" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-surface-container motion-reduce:animate-none" />
    </div>
  )
}

export default function Hero() {
  const whatsapp = useWhatsApp()
  const shop = useShop()
  const reduce = useReducedMotion()

  // Same query as the "Most-loved arrangements" grid, so this costs no extra request.
  const { data: products, isError } = useQuery({ queryKey: ['products', {}], queryFn: () => listProducts() })
  const picks = products
    ? products.filter((p) => p.isFeatured && p.stock > 0 && p.images.length > 0 && p.categoryId !== 'indoor-plants').slice(0, 2)
    : []
  const showTiles = !isError && (!products || picks.length > 0)

  return (
    // Fills the first screen exactly: the viewport minus the sticky header (101px phone, 109px desktop).
    <section
      aria-labelledby="home-hero-title"
      className="bg-aurora relative isolate flex min-h-[calc(100svh-101px)] overflow-hidden lg:min-h-[max(640px,calc(100svh-109px))]"
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-8 px-4 py-8 lg:grid-cols-12 lg:gap-10 lg:px-12 lg:py-10">
        {/* ---------------- Words ---------------- */}
        <motion.div
          className="lg:col-span-6"
          initial="hidden"
          animate="show"
          variants={staggerContainer(0.09, 0.1)}
        >
          <motion.div variants={fadeUp}>
            <DeliveryStatus />
          </motion.div>

          <motion.p variants={fadeUp} className="eyebrow mt-6 flex items-center gap-3 font-bold text-[#7a4f05]">
            <span className="h-px w-8 bg-[#c8930a]/60" aria-hidden="true" />
            <span><span className="hidden sm:inline">{shop.shopName} · </span>{shop.tagline || 'Sri Lankan flower studio'}</span>
          </motion.p>

          <motion.h1
            id="home-hero-title"
            variants={fadeUp}
            className="mt-4 font-display text-[clamp(2rem,10vw,4.4rem)] lg:text-[clamp(2.4rem,min(4.7vw,8.6vh),4.6rem)] leading-[1.05] tracking-[-0.02em] text-primary"
          >
            Make every
            <br />
            <span className="whitespace-nowrap">
            moment{' '}
            {/* A small photo set into the headline, the height of the lettering. */}
            <span
              aria-hidden="true"
              className="ml-1 mr-[0.22em] inline-block h-[0.74em] w-[1.7em] overflow-hidden rounded-full align-[-0.06em] shadow-[0_8px_20px_-10px_rgba(28,25,23,0.6)]"
            >
              <img
                src={`${HERO_PHOTO}-1280.webp`}
                alt=""
                className="h-full w-full object-cover object-[78%_40%]"
                width={170}
                height={74}
                decoding="async"
              />
            </span>
            <em className="pr-2 font-normal italic text-tertiary">bloom</em>
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-5 max-w-[34rem] text-[16px] leading-relaxed text-secondary sm:text-[18px]">
            Hand-tied bouquets, hampers and gifts from our Colombo studio, delivered fresh across Sri Lanka.
            {offersSameDay(shop) && <> Same-day delivery in Colombo for orders placed before {formatClock(shop.sameDayCutoff)}.</>}
          </motion.p>

          <motion.div variants={fadeUp} className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-4">
            <MotionLink
              to="/shop"
              {...pressable}
              className="btn-gradient inline-flex min-h-[52px] items-center justify-center gap-3 whitespace-nowrap px-8 shadow-[0_18px_40px_-16px_rgba(200,147,10,0.75)]"
            >
              Shop flowers <ArrowRight size={16} aria-hidden="true" />
            </MotionLink>
            <a
              href={whatsapp(`Hello ${shop.shopName}! I'd like to order some flowers.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-2 text-[15px] font-medium text-primary underline decoration-primary/30 underline-offset-4 transition-colors hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              <WhatsAppIcon size={18} className="text-[#1a9e4b]" /> or order on WhatsApp
            </a>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-7">
            <p className="eyebrow text-secondary">Shop by occasion</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {QUICK_OCCASIONS.map((o) => (
                <li key={o.slug}>
                  <Link
                    to={`/shop?occasion=${o.slug}`}
                    className="inline-flex min-h-[44px] items-center rounded-full border border-outline-variant bg-white/80 px-4 text-[14px] font-medium text-primary transition-colors duration-200 hover:border-primary hover:bg-primary hover:text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    {o.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.ul variants={fadeUp} className="mt-7 hidden flex-wrap gap-x-6 gap-y-2 border-t border-outline-variant/70 pt-5 sm:[@media(min-height:820px)]:flex">
            {PROMISES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-[14px] font-medium text-on-surface-variant">
                <Icon size={16} className="text-tertiary" aria-hidden="true" /> {label}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        {/* ---------------- Pictures: an arched photo beside two real products ---------------- */}
        <div
          className={`grid h-[min(420px,56svh)] gap-4 sm:h-[min(520px,60svh)] lg:col-span-6 lg:h-[min(560px,calc(100svh-230px))] lg:gap-5 ${
            showTiles ? 'grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]' : 'mx-auto w-full max-w-md grid-cols-1'
          }`}
        >
          <motion.div
            className="relative min-h-0 overflow-hidden rounded-t-full rounded-b-[2rem] bg-[#f3d9df] shadow-[0_40px_60px_-36px_rgba(28,25,23,0.6)]"
            // Only rises into place (never starts invisible), so the main photo counts as painted at once.
            initial={reduce ? false : { y: 36 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: EASE_OUT }}
          >
            {/* The one slow, endless movement in the hero: the flowers gently breathe. */}
            <motion.img
              src={`${HERO_PHOTO}-1280.webp`}
              srcSet={`${HERO_PHOTO}-1280.webp 1280w, ${HERO_PHOTO}-1920.webp 1920w`}
              sizes="(min-width: 1280px) 320px, (min-width: 1024px) 25vw, 50vw"
              alt="A wall of soft pink peonies"
              fetchPriority="high"
              loading="eager"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
              animate={reduce ? undefined : { scale: [1, 1.07, 1] }}
              transition={reduce ? undefined : { duration: 26, ease: 'easeInOut', repeat: Infinity }}
            />
          </motion.div>

          {showTiles && (
            <motion.div
              className="flex min-h-0 flex-col gap-4 pt-8 lg:gap-5 lg:pt-14"
              initial={reduce ? false : { opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.38, ease: EASE_OUT }}
            >
              {picks.length > 0 ? (
                picks.map((p) => <ProductTile key={p.id} product={p} className="flex-1" />)
              ) : (
                <>
                  <TileSkeleton />
                  <TileSkeleton />
                </>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  )
}
