import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import BloomFlower from './BloomFlower'
import WhatsAppIcon from '../ui/WhatsAppIcon'
import { EASE_OUT, fadeUp, pressable, staggerContainer } from '../motion/variants'
import { useShop, useWhatsApp } from '../../hooks/useShop'
import { useCutoffCountdown } from '../../hooks/useCutoffCountdown'
import { getSettings } from '../../services/shop'
import { formatClock } from '../../lib/dates'
import { listWords, sameDayDistricts } from '../../lib/shopInfo'

const MotionLink = motion.create(Link)

// The first screen: a flower that opens from bud to full bloom as you scroll.
//
// The section is a tall "scroll track". Inside it the content is pinned (sticky) while the
// visitor scrolls through the track, and that scroll position drives the bloom (0 = bud, 1 = full
// bloom). Scrolling back up closes it again. With "reduce motion" the flower simply shows in full
// bloom and the section is a normal height.

const STAGES = [
  { at: 0, title: 'Bud', text: 'Cut at dawn in the hills' },
  { at: 0.42, title: 'Unfurling', text: 'Hand-tied in our Colombo studio' },
  { at: 0.8, title: 'Full bloom', text: 'Opening at their door' },
]

function formatLeft(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h === 0 ? `${m} min` : m === 0 ? `${h} h` : `${h} h ${m} min`
}

// One live line about ordering today, from the shop's settings and the Colombo clock.
function DeliveryStatus() {
  const shop = useShop()
  const { isSuccess } = useQuery({ queryKey: ['settings'], queryFn: getSettings, staleTime: 5 * 60_000 })
  const left = useCutoffCountdown(shop.sameDayCutoff)
  const sameDay = shop.acceptingOrders ? sameDayDistricts(shop) : []

  let text: string
  let tone = 'bg-[#fb923c]'
  if (!shop.acceptingOrders) {
    tone = 'bg-[#fcd34d]'
    text = 'Online orders are paused. Message us on WhatsApp.'
  } else if (sameDay.length > 0 && left !== null) {
    text = `Order within ${formatLeft(left)} for same-day delivery in ${listWords(sameDay)}`
  } else {
    text = 'Order now, delivered from tomorrow'
  }

  return (
    <p
      aria-hidden={!isSuccess}
      className={`inline-flex max-w-full items-center gap-2.5 rounded-full border border-white/15 bg-white/5 py-2 pl-3 pr-4 text-[13px] font-medium text-[#ffedd5] backdrop-blur-sm sm:text-[14px] ${isSuccess ? '' : 'invisible'}`}
    >
      <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:hidden ${tone}`} />
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${tone}`} />
      </span>
      <span className="truncate">{text}</span>
    </p>
  )
}

// The three stage captions under the flower; each fades in for its part of the scroll.
function StageCaption({ progress, index }: { progress: MotionValue<number>; index: number }) {
  const start = STAGES[index].at
  const end = STAGES[index + 1]?.at ?? 1.01
  const first = index === 0
  const last = index === STAGES.length - 1
  const opacity = useTransform(progress, [start - 0.08, start + 0.04, end - 0.06, end + 0.02], first ? [1, 1, 1, 0] : last ? [0, 1, 1, 1] : [0, 1, 1, 0])
  const y = useTransform(progress, [start - 0.08, start + 0.04], first ? [0, 0] : [12, 0])
  return (
    <motion.div style={{ opacity, y }} className="absolute inset-x-0 text-center">
      <p className="eyebrow text-[#fdba74]">{STAGES[index].title}</p>
      <p className="mt-1 font-display text-[19px] italic text-[#ffedd5]">{STAGES[index].text}</p>
    </motion.div>
  )
}

export default function Hero() {
  const shop = useShop()
  const whatsapp = useWhatsApp()
  const reduce = useReducedMotion()
  const track = useRef<HTMLElement>(null)

  const { scrollYProgress } = useScroll({ target: track, offset: ['start start', 'end end'] })
  // A soft spring so the bloom glides instead of jumping with each scroll-wheel step.
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.4 })
  const fullBloom = useMotionValue(1)
  const progress = reduce ? fullBloom : smooth

  const barWidth = useTransform(progress, (v) => `${Math.round(v * 100)}%`)
  const flowerScale = useTransform(progress, [0, 1], [0.95, 1])
  const flowerY = useTransform(progress, [0, 1], [18, 0])
  const sameDay = sameDayDistricts(shop)

  return (
    <section
      ref={track}
      aria-labelledby="home-hero-title"
      // The extra height is the distance the visitor scrolls while the flower opens.
      className={`bg-ink-gradient relative text-on-primary ${reduce ? '' : 'h-[220vh] lg:h-[250vh]'}`}
    >
      <div className="sticky top-[101px] flex h-[calc(100svh-101px)] min-h-[620px] items-center overflow-hidden lg:top-[109px] lg:h-[calc(100svh-109px)]">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-8 px-5 py-8 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:px-12">
          {/* ---------------- Words: one message, one main action ---------------- */}
          <motion.div className="order-2 max-w-xl lg:order-1" initial="hidden" animate="show" variants={staggerContainer(0.09, 0.1)}>
            <motion.div variants={fadeUp}>
              <DeliveryStatus />
            </motion.div>

            <motion.h1
              id="home-hero-title"
              variants={fadeUp}
              className="mt-6 font-display text-[clamp(2.4rem,8.5vw,4rem)] leading-[1.04] tracking-[-0.02em] text-white lg:mt-8 lg:text-[clamp(3rem,min(5vw,9vh),5.25rem)]"
            >
              From bud
              <br />
              to <em className="text-gradient-light whitespace-nowrap pr-2 font-normal italic">full bloom</em>
            </motion.h1>

            <motion.p variants={fadeUp} className="mt-6 max-w-[34rem] text-[16px] leading-relaxed text-[#f1e7dc]/80 sm:text-[18px]">
              Hand-tied bouquets, hampers and gifts from our Colombo studio, made fresh every morning and delivered across Sri Lanka
              {sameDay.length > 0 && shop.acceptingOrders ? <>, same-day before {formatClock(shop.sameDayCutoff)}</> : null}.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 lg:mt-10">
              <MotionLink to="/shop" {...pressable} className="btn-gradient inline-flex min-h-[52px] items-center justify-center gap-3 whitespace-nowrap px-8">
                Shop flowers <ArrowRight size={16} aria-hidden="true" />
              </MotionLink>
              <a
                href={whatsapp(`Hello ${shop.shopName}! I'd like to order some flowers.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-2 text-[15px] font-semibold text-white underline decoration-white/30 underline-offset-4 transition-colors hover:decoration-[#fb923c] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                <WhatsAppIcon size={18} className="text-[#25D366]" /> or order on WhatsApp
              </a>
            </motion.div>
          </motion.div>

          {/* ---------------- The flower on its stage ---------------- */}
          <div className="order-1 flex flex-col items-center lg:order-2">
            <div className="relative aspect-square w-[min(72vw,34svh)] sm:w-[min(60vw,40svh)] lg:w-[min(100%,60svh,560px)]">
              {/* the stage: a soft glow and two fine rings, so even the small bud sits in a balanced frame */}
              <div aria-hidden="true" className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_45%,rgba(249,115,22,0.22),rgba(249,115,22,0.06)_45%,transparent_70%)]" />
              <div aria-hidden="true" className="absolute inset-[6%] rounded-full border border-white/10" />
              <div aria-hidden="true" className="absolute inset-[18%] rounded-full border border-white/5" />
              <motion.div
                className="absolute inset-[4%]"
                style={{ scale: flowerScale, y: flowerY }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, ease: EASE_OUT }}
              >
                <BloomFlower progress={progress} />
              </motion.div>
            </div>

            {/* What stage the flower is at, and how far it has opened */}
            {!reduce && (
              <div className="mt-4 hidden w-full max-w-xs sm:block lg:mt-6" aria-hidden="true">
                <div className="relative h-12">
                  {STAGES.map((_, i) => (
                    <StageCaption key={i} progress={progress} index={i} />
                  ))}
                </div>
                <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-white/10">
                  <motion.div style={{ width: barWidth }} className="h-full rounded-full bg-gradient-to-r from-[#ea580c] to-[#fdba74]" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
