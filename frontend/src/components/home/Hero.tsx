import { useRef, type PointerEvent } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import { ArrowRight, Clock, MessageCircle, PenLine, ShieldCheck, Star, Truck } from 'lucide-react'
import { EASE_OUT } from '../motion/variants'
import { useShop, useWhatsApp } from '../../hooks/useShop'
import { useCutoffCountdown } from '../../hooks/useCutoffCountdown'
import { useReviews } from '../../hooks/useReviews'

// The first screen, on the shop's own cream and gold. Left: the live same-day countdown, the
// headline, a line about the shop, the two ways to order and four promises. Right: a hand-held
// bouquet (cut out, no background) rising from the base of a soft gold arch, its flowers spilling
// past the arch's sides. On phones the bouquet comes first, so the opening screen shows flowers.
//
// Motion: the arch panel rises and its gold outline is drawn in from the base; the bouquet settles, then sways and
// follows the mouse a little (the arch moves the other way, for depth); a few petals drift down.
// The words rise in order and "Bloom" catches one gold shimmer. The countdown pill has a live dot
// and rolls its time over each minute. Everything waits for the opening screen to lift, and none of
// the movement runs for visitors who have asked their device for reduced motion.

const BOUQUET = { small: '/images/home/hero-bouquet-720.webp', large: '/images/home/hero-bouquet-1200.webp' }
const HEADLINE = ['Make', 'Every', 'Moment']
// Where each drifting petal starts (across the arch), how long it takes, when it starts and how far it sways.
const PETALS = [
  { left: '18%', duration: '11s', delay: '2.2s', drift: '26px', size: 14 },
  { left: '38%', duration: '13s', delay: '5.5s', drift: '-22px', size: 11 },
  { left: '62%', duration: '10s', delay: '3.4s', drift: '30px', size: 13 },
  { left: '80%', duration: '12.5s', delay: '7.8s', drift: '-18px', size: 10 },
  { left: '50%', duration: '14s', delay: '10s', drift: '20px', size: 12 },
]

export default function Hero({ ready = true }: { ready?: boolean }) {
  const reduce = useReducedMotion()
  const shop = useShop()
  const whatsapp = useWhatsApp()
  const minutesLeft = useCutoffCountdown(shop.sameDayCutoff)
  const { data: reviews } = useReviews()
  const live = ready && !reduce

  const section = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end start'] })
  const bouquetScrollY = useTransform(scrollYProgress, [0, 1], ['0%', '10%'])

  // The pointer's place over the hero, from -1 to 1 on each axis, eased with a soft spring.
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const easedX = useSpring(pointerX, { stiffness: 70, damping: 20, mass: 0.6 })
  const easedY = useSpring(pointerY, { stiffness: 70, damping: 20, mass: 0.6 })
  const bouquetX = useTransform(easedX, [-1, 1], [-16, 16])
  const bouquetY = useTransform(easedY, [-1, 1], [-10, 10])
  const bouquetTilt = useTransform(easedX, [-1, 1], [-2.5, 2.5])
  const archX = useTransform(easedX, [-1, 1], [7, -7])
  const archY = useTransform(easedY, [-1, 1], [5, -5])

  function followPointer(e: PointerEvent<HTMLElement>) {
    if (!live || e.pointerType !== 'mouse') return
    const box = e.currentTarget.getBoundingClientRect()
    pointerX.set(((e.clientX - box.left) / box.width) * 2 - 1)
    pointerY.set(((e.clientY - box.top) / box.height) * 2 - 1)
  }
  function resetPointer() {
    pointerX.set(0)
    pointerY.set(0)
  }

  // Until the opening screen lifts, everything waits at its starting pose.
  const play = <T,>(target: T) => (ready ? target : undefined)
  const rise = (delay: number) => ({
    initial: { opacity: 0, y: 22 },
    animate: play({ opacity: 1, y: 0 }),
    transition: { duration: 0.75, delay, ease: EASE_OUT },
  })

  const promises = [
    { icon: Truck, label: 'Same-day in Colombo' },
    { icon: PenLine, label: 'Free handwritten card' },
    { icon: ShieldCheck, label: 'Freshness guaranteed' },
    // The rating comes from the published reviews; with none yet, this promise is left out.
    ...(reviews && reviews.count > 0 ? [{ icon: Star, label: `${reviews.average.toFixed(1)} from customers`, href: '#voices-title' }] : []),
  ]
  const countingDown = shop.acceptingOrders && minutesLeft !== null

  return (
    <section
      ref={section}
      onPointerMove={followPointer}
      onPointerLeave={resetPointer}
      aria-labelledby="home-hero-title"
      className="relative overflow-hidden bg-surface bg-[radial-gradient(60%_55%_at_85%_10%,rgba(252,228,236,0.75)_0%,rgba(252,228,236,0)_70%),radial-gradient(50%_60%_at_5%_90%,rgba(233,195,73,0.14)_0%,rgba(233,195,73,0)_70%)]"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-6 px-4 pb-8 pt-5 sm:gap-10 sm:pt-8 lg:min-h-[calc(100svh-113px)] lg:grid-cols-2 lg:gap-16 lg:px-12 lg:py-8">
        {/* ---- the words ---- */}
        <div>
          <motion.p {...rise(0.15)} className="inline-flex items-center gap-2.5 rounded-full bg-[#1b1c1c] py-2 pl-3.5 pr-4 text-[13px] font-medium text-white sm:text-[14px]">
            {countingDown ? (
              <span aria-hidden="true" className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#e9c349] opacity-70 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#e9c349]" />
              </span>
            ) : (
              <Clock size={16} aria-hidden="true" className="shrink-0 text-[#e9c349]" />
            )}
            {!shop.acceptingOrders ? (
              'Online orders are paused today'
            ) : minutesLeft !== null ? (
              <span>
                Same-day<span className="hidden sm:inline"> delivery</span> — order within{' '}
                <span className="relative inline-flex overflow-hidden align-bottom">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={minutesLeft}
                      initial={{ y: '-100%', opacity: 0 }}
                      animate={{ y: '0%', opacity: 1 }}
                      exit={{ y: '100%', opacity: 0 }}
                      transition={{ type: 'spring', bounce: 0, visualDuration: 0.35 }}
                      className="inline-block tabular-nums"
                    >
                      {Math.floor(minutesLeft / 60)}h {minutesLeft % 60}m
                    </motion.span>
                  </AnimatePresence>
                </span>
              </span>
            ) : (
              'Order now for next-day delivery'
            )}
          </motion.p>

          <h1 id="home-hero-title" className="mt-4 sm:mt-6 font-display text-[clamp(2.4rem,min(5.4vw,8.5svh),5rem)] font-normal leading-[1.03] tracking-[-0.015em] text-[#1b1c1c]">
            {HEADLINE.map((word, i) => (
              <span key={word}>
                <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                  <motion.span
                    className="inline-block"
                    initial={{ y: '108%' }}
                    animate={play({ y: '0%' })}
                    transition={{ type: 'spring', bounce: 0, visualDuration: 0.85, delay: 0.3 + i * 0.1 }}
                  >
                    {word}
                  </motion.span>
                </span>{' '}
              </span>
            ))}
            <span className="inline-block overflow-hidden pb-[0.08em] pr-[0.08em] align-bottom">
              <motion.span
                className="hero-bloom inline-block italic"
                initial={{ y: '108%' }}
                animate={play({ y: '0%' })}
                transition={{ type: 'spring', bounce: 0, visualDuration: 0.85, delay: 0.6 }}
              >
                Bloom
              </motion.span>
            </span>
          </h1>

          <motion.p {...rise(0.8)} className="mt-3 max-w-[34rem] text-[15px] leading-[1.65] sm:mt-5 sm:text-[17.5px] sm:leading-[1.75] text-on-surface-variant">
            Hand-tied bouquets of Nuwara Eliya roses, lilies and orchids — arranged in Colombo each morning and delivered across Sri Lanka with
            a handwritten card.
          </motion.p>

          <motion.div {...rise(0.95)} className="mt-5 flex flex-wrap gap-3 sm:mt-7">
            <Link
              to="/shop"
              className="hero-spring btn-gradient group inline-flex min-h-[50px] items-center justify-center gap-2 px-5 text-[13px] sm:min-h-[54px] sm:gap-3 sm:px-8 sm:text-[14px] font-semibold uppercase tracking-[0.14em]"
            >
              Shop flowers
              <ArrowRight size={17} aria-hidden="true" className="transition-transform duration-300 ease-out group-hover:translate-x-1 motion-reduce:transition-none" />
            </Link>
            <a
              href={whatsapp('Hello! I would like to order flowers.')}
              target="_blank"
              rel="noopener noreferrer"
              className="hero-spring group inline-flex min-h-[50px] items-center justify-center gap-2 rounded-lg border border-[#1b1c1c]/15 bg-surface-container-lowest px-4 text-[13px] sm:min-h-[54px] sm:gap-3 sm:px-7 sm:text-[14px] font-semibold uppercase tracking-[0.12em] text-[#1b1c1c] hover:border-[#1b1c1c]/40 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#1b1c1c]"
            >
              <MessageCircle size={19} aria-hidden="true" className="hero-wiggle text-[#25D366]" /> Order on WhatsApp
            </a>
          </motion.div>

          <motion.ul
            initial="hidden"
            animate={play('show')}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 1.1 } } }}
            className="mt-8 hidden max-w-[34rem] grid-cols-2 sm:grid gap-x-6 gap-y-3 border-t border-outline-variant/60 pt-5 text-[14px] text-on-surface sm:text-[15px]"
          >
            {promises.map(({ icon: Icon, label, href }) => (
              <motion.li
                key={label}
                variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } } }}
                className="flex items-center gap-2.5"
              >
                <Icon size={17} aria-hidden="true" className={`shrink-0 ${Icon === Star ? 'fill-[#d4af37] text-[#d4af37]' : 'text-tertiary'}`} />
                {href ? (
                  <a href={href} className="underline-offset-4 hover:text-tertiary hover:underline">
                    {label}
                  </a>
                ) : (
                  label
                )}
              </motion.li>
            ))}
          </motion.ul>
        </div>

        {/* ---- the bouquet, rising from its gold arch (first on phones) ---- */}
        <div className="relative order-first mx-auto aspect-[4/5] w-full max-w-[190px] sm:max-w-[300px] lg:order-none lg:max-w-[min(500px,calc((100svh-190px)*0.8))]">
          <motion.div aria-hidden="true" className="absolute inset-x-[7%] inset-y-0" style={live ? { x: archX, y: archY } : undefined}>
            {/* the arch panel rises from its base */}
            <motion.div
              initial={{ opacity: 0, scaleY: 0.55 }}
              animate={play({ opacity: 1, scaleY: 1 })}
              transition={{ duration: 1.1, delay: 0.2, ease: EASE_OUT }}
              className="absolute inset-0 origin-bottom rounded-t-full bg-[linear-gradient(180deg,#f7ecd6_0%,#f6e6e9_70%,#f3e3e6_100%)]"
            />
            {/* the gold outline is drawn in from the base up, after the panel */}
            <motion.span
              initial={{ clipPath: 'inset(100% 0% 0% 0%)' }}
              animate={play({ clipPath: 'inset(0% 0% 0% 0%)' })}
              transition={{ duration: 1.6, delay: 0.5, ease: [0.65, 0, 0.35, 1] }}
              className="absolute -inset-2.5 rounded-t-full border border-[#d4af37]/60"
            />
          </motion.div>

          {/* petals drifting down past the bouquet */}
          {live && (
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-visible">
              {PETALS.map((p) => (
                <span
                  key={p.left}
                  className="hero-petal absolute top-[18%]"
                  style={{ left: p.left, width: p.size, height: p.size * 1.35, animationDuration: p.duration, animationDelay: p.delay, ['--drift' as string]: p.drift }}
                />
              ))}
            </div>
          )}

          <motion.div style={reduce ? undefined : { y: bouquetScrollY }} className="absolute bottom-0 left-[-10%] w-[120%]">
            <motion.div style={live ? { x: bouquetX, y: bouquetY, rotate: bouquetTilt } : undefined} className="origin-bottom">
              <motion.img
                src={BOUQUET.large}
                srcSet={`${BOUQUET.small} 720w, ${BOUQUET.large} 1209w`}
                sizes="(min-width: 1024px) 600px, (min-width: 640px) 430px, 330px"
                alt="A hand holding a bouquet of pink roses, peach peonies, daisies and yellow tansy"
                fetchPriority="high"
                initial={{ opacity: 0, y: 40, scale: 0.94 }}
                animate={play({ opacity: 1, y: 0, scale: 1 })}
                transition={{ type: 'spring', bounce: 0.2, visualDuration: 1, delay: 0.45 }}
                className={`hero-bouquet relative w-full drop-shadow-[0_30px_40px_rgba(107,90,96,0.25)] ${live ? 'hero-bouquet-sway' : ''}`}
              />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* the way on down to the products */}
      <motion.a
        href="#all-products-title"
        initial={{ opacity: 0 }}
        animate={play({ opacity: 1 })}
        transition={{ duration: 0.8, delay: 1.8 }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[12px] font-medium uppercase tracking-[0.24em] text-on-surface-variant hover:text-tertiary lg:flex"
      >
        Scroll
        <span aria-hidden="true" className="relative block h-10 w-px overflow-hidden bg-outline-variant/70">
          <span className="hero-scroll-dot absolute left-0 top-0 block h-3 w-px bg-[#d4af37]" />
        </span>
      </motion.a>
    </section>
  )
}
