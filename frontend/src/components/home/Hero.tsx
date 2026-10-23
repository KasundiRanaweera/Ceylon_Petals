import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import { ArrowRight, Clock, PenLine, ShieldCheck, Star, Truck } from 'lucide-react'
import { EASE_OUT } from '../motion/variants'
import { useShop, useWhatsApp } from '../../hooks/useShop'
import { useCutoffCountdown } from '../../hooks/useCutoffCountdown'
import { useReviews } from '../../hooks/useReviews'

// The first screen, centred: a lily on the dark background, fully open at first and
// closing back into a bud as you scroll. Under it, the live same-day countdown (touching the stem),
// the headline, the two ways to order and a row of four promises.
//
// The section is taller than the screen and its panel sticks in place, so scrolling first plays the
// lily closing (scrolling back up opens it again) and only then moves on to the next section.
//
// The bloom is built from five real photographs of the same lily at different stages (bud, opening,
// unfolding, blooming, fully open), lined up on one stem in public/images/home/bloom. Each stage
// dissolves into the next while the camera pushes in slowly; the last step zooms stage four up to
// meet the full-bloom photo, so the flower grows rather than jumps. It is a dissolve between real
// stages, not a continuous film of the petals moving.
//
// Visitors who ask their device for reduced motion get the fully open lily, with no pinning.
// The hero always uses the dark palette, so its words stay readable on the dark photograph.

const HEADLINE = ['Make', 'Every', 'Moment']
const STAGES = [1, 2, 3, 4, 5].map((n) => ({
  src: `/images/home/bloom/stage-${n}.webp`,
  srcSet: `/images/home/bloom/stage-${n}-680.webp 680w, /images/home/bloom/stage-${n}.webp 1020w`,
}))
const SIZES = '(min-width: 1024px) 60vw, 90vw'
// The bottom of the stem and the centre of the open flower, as fractions of the 1020 x 790 frame
// (the frames had 110 px of empty sky trimmed off the top, so the lily sits close to the nav bar).
// The camera grows from the first; the last zoom centres on the second.
const STEM_BASE = '48% 97.7%'
const FLOWER_CENTRE = '48% 40.8%'
// The full bloom's head is this much larger than stage four's on the shared frame.
const LAST_ZOOM = 1.45

export default function Hero({ ready = true }: { ready?: boolean }) {
  const reduce = useReducedMotion()
  const shop = useShop()
  const whatsapp = useWhatsApp()
  const minutesLeft = useCutoffCountdown(shop.sameDayCutoff)
  const { data: reviews } = useReviews()

  // 0 at the top of the hero, 1 once its extra scroll length has gone by, eased so a mouse wheel's
  // steps still feel smooth.
  const section = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] })
  const p = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4, restDelta: 0.0005 })

  // How open the lily is: 1 (full bloom) at the top of the hero, 0 (a closed bud) at the end.
  const bloom = useTransform(p, (v) => 1 - v)

  // each stage fades in over the one before (their dark backgrounds match, so nothing flickers)
  const show2 = useTransform(bloom, [0.1, 0.28], [0, 1])
  const show3 = useTransform(bloom, [0.32, 0.5], [0, 1])
  const show4 = useTransform(bloom, [0.54, 0.72], [0, 1])
  const show5 = useTransform(bloom, [0.78, 0.94], [0, 1])
  // (read from bud to bloom) the camera is close on the bud and settles back as it opens, then the matched zoom from
  // stage four into the full bloom
  const camera = useTransform(bloom, [0, 0.76], [1.12, 1])
  const growOut = useTransform(bloom, [0.78, 0.94], [1, LAST_ZOOM])
  const growIn = useTransform(bloom, [0.78, 0.94], [1 / LAST_ZOOM, 1])

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
      data-theme="dark"
      aria-labelledby="home-hero-title"
      className={`relative bg-[#0a090a] text-on-surface ${reduce ? '' : 'h-[200vh] lg:h-[260vh]'}`}
    >
      <div className={`${reduce ? 'relative min-h-[calc(100svh-var(--header-h,97px))]' : 'sticky top-[var(--header-h,97px)] h-[calc(100svh-var(--header-h,97px))]'} overflow-hidden`}>
        {/* the dark room: a warm glow behind the flower, darker towards the edges */}
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(60%_70%_at_50%_38%,#2a1a1f_0%,#140f11_45%,#0a090a_75%)]" />

        <div className="relative mx-auto flex h-full max-w-5xl flex-col items-center px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] text-center sm:pb-[calc(3.5rem+env(safe-area-inset-bottom))] lg:pb-[4svh]">
          {/* the lily takes whatever height the words leave, centred; the words start under its stem */}
          <div className="flex min-h-0 w-full flex-1 items-center justify-center [container-type:size] sm:items-end">
          {/* ---- the lily ---- */}
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={play({ opacity: 1 })}
            transition={{ duration: 1.4, delay: 0.2, ease: EASE_OUT }}
            className="relative aspect-[1020/790] w-[min(215cqw,158cqh)] shrink-0 sm:-mb-[15cqh] sm:w-[min(130cqw,148.5cqh)] [mask-image:radial-gradient(54%_56%_at_50%_50%,#000_64%,transparent_100%)]"
          >
            {reduce ? (
              <img src={STAGES[4].src} srcSet={STAGES[4].srcSet} sizes={SIZES} alt="" className="h-full w-full object-cover" />
            ) : (
              <motion.div className="absolute inset-0" style={{ scale: camera, transformOrigin: STEM_BASE }}>
                {/* stages one to four, which zoom out of the way as the full bloom arrives */}
                <motion.div className="absolute inset-0" style={{ scale: growOut, transformOrigin: FLOWER_CENTRE }}>
                  <img src={STAGES[0].src} srcSet={STAGES[0].srcSet} sizes={SIZES} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  <motion.img src={STAGES[1].src} srcSet={STAGES[1].srcSet} sizes={SIZES} alt="" style={{ opacity: show2 }} className="absolute inset-0 h-full w-full object-cover" />
                  <motion.img src={STAGES[2].src} srcSet={STAGES[2].srcSet} sizes={SIZES} alt="" style={{ opacity: show3 }} className="absolute inset-0 h-full w-full object-cover" />
                  <motion.img src={STAGES[3].src} srcSet={STAGES[3].srcSet} sizes={SIZES} alt="" style={{ opacity: show4 }} className="absolute inset-0 h-full w-full object-cover" />
                </motion.div>
                <motion.img
                  src={STAGES[4].src}
                  srcSet={STAGES[4].srcSet}
                  sizes={SIZES}
                  alt=""
                  fetchPriority="high"
                  style={{ opacity: show5, scale: growIn, transformOrigin: FLOWER_CENTRE }}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </motion.div>
            )}
          </motion.div>
          </div>
          <span className="sr-only">A pink lily in full bloom that closes back into a bud as you scroll.</span>
        {/* ---- the words ---- */}
        <div className="relative z-10 -mt-[3svh] shrink-0">
          <motion.p {...rise(0.15)} className="inline-flex items-center gap-2 rounded-full bg-[#1b1c1c]/85 py-1 pl-2.5 pr-3 text-[11.5px] font-medium text-white backdrop-blur sm:text-[12px]">
            {countingDown ? (
              <span aria-hidden="true" className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#e9c349] opacity-70 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#e9c349]" />
              </span>
            ) : (
              <Clock size={14} aria-hidden="true" className="shrink-0 text-[#e9c349]" />
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

          <h1 id="home-hero-title" className="mt-3 font-display text-[clamp(1.65rem,min(2.9vw,5svh),2.75rem)] max-lg:[@media(max-height:620px)]:text-[1.5rem] font-normal leading-[1.06] tracking-[-0.01em] text-on-surface sm:mt-3.5">
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
                {i === 1 && <br className="hidden sm:block" />}
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

          <motion.div {...rise(0.95)} className="mt-4 flex flex-wrap justify-center gap-2.5 sm:mt-5">
            <Link
              to="/shop"
              className="hero-spring btn-gradient group inline-flex min-h-[40px] items-center justify-center gap-2 px-4 text-[11.5px] sm:min-h-[42px] sm:px-6 sm:text-[12px] font-semibold uppercase tracking-[0.14em]"
            >
              Shop flowers
              <ArrowRight size={14} aria-hidden="true" className="transition-transform duration-300 ease-out group-hover:translate-x-1 motion-reduce:transition-none" />
            </Link>
            <a
              href={whatsapp('Hello! I would like to order flowers.')}
              target="_blank"
              rel="noopener noreferrer"
              className="hero-spring group inline-flex max-sm:hidden min-h-[40px] items-center justify-center gap-2 rounded-lg border border-on-surface/15 bg-surface-container-lowest px-4 text-[11.5px] sm:min-h-[42px] sm:px-5 sm:text-[12px] font-semibold uppercase tracking-[0.12em] text-on-surface hover:border-on-surface/40 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-on-surface"
            >
              Order on WhatsApp
            </a>
          </motion.div>

          <motion.ul
            initial="hidden"
            animate={play('show')}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 1.1 } } }}
            className="mt-4 hidden w-full max-w-[21rem] grid-cols-2 gap-2 text-[12px] text-on-surface max-sm:[@media(min-height:620px)]:grid sm:mt-5 sm:flex sm:w-auto sm:max-w-none sm:gap-0 sm:divide-x sm:divide-white/15 sm:text-[11.5px] lg:text-[12px] sm:max-lg:[@media(max-height:760px)]:hidden lg:[@media(max-height:700px)]:mt-6"
          >
            {promises.map(({ icon: Icon, label, href }) => (
              <motion.li
                key={label}
                variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } } }}
                className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-left leading-tight sm:flex-col sm:gap-1 sm:px-4 sm:py-0 sm:text-center lg:px-7"
              >
                <Icon size={16} aria-hidden="true" className={`shrink-0 ${Icon === Star ? 'fill-[#d4af37] text-[#d4af37]' : 'text-[#e9c349]'}`} />
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
        </div>

      </div>
    </section>
  )
}
