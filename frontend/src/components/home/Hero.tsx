import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import { ArrowRight, Clock, MessageCircle, PenLine, ShieldCheck, Star, Truck } from 'lucide-react'
import { EASE_OUT } from '../motion/variants'
import { useShop, useWhatsApp } from '../../hooks/useShop'
import { useCutoffCountdown } from '../../hooks/useCutoffCountdown'
import { useReviews } from '../../hooks/useReviews'

// The first screen. Left: the live same-day countdown, the headline, a line about the shop, the two
// ways to order and four promises (unchanged). Right: a lily, fully open at first, that closes back
// into a bud as you scroll.
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
// The bottom of the stem and the centre of the open flower, as fractions of the 1020 x 900 frame.
// The camera grows from the first; the last zoom centres on the second.
const STEM_BASE = '48% 98%'
const FLOWER_CENTRE = '48% 48%'
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
  const cueOpacity = useTransform(p, [0, 0.85, 0.95], [1, 1, 0])
  const cueFill = useTransform(p, [0, 0.95], [0, 1])

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
        {/* the dark room: a warm glow behind the flower, darker towards the words */}
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(60%_70%_at_72%_45%,#2a1a1f_0%,#140f11_45%,#0a090a_75%)]" />

        {/* ---- the lily ---- */}
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={play({ opacity: 1 })}
          transition={{ duration: 1.4, delay: 0.2, ease: EASE_OUT }}
          className="absolute left-1/2 top-[3%] aspect-[1020/900] h-[46%] -translate-x-1/2 sm:h-[52%] max-lg:[@media(max-height:700px)]:h-[36%] lg:bottom-0 lg:left-auto lg:right-[-8%] lg:top-auto lg:h-[96%] lg:max-w-[58vw] lg:translate-x-0 [mask-image:radial-gradient(72%_72%_at_50%_52%,#000_58%,transparent_100%)]"
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
          {/* on large screens the photo's left edge melts into the dark beside the words */}
          <span className="absolute inset-y-0 left-0 hidden w-[34%] bg-[linear-gradient(to_right,#0b090a_0%,rgba(11,9,10,0.85)_30%,rgba(11,9,10,0)_100%)] lg:block" />
        </motion.div>
        <span className="sr-only">A pink lily in full bloom that closes back into a bud as you scroll.</span>

        <div className="relative mx-auto grid h-full max-w-7xl grid-cols-1 items-end px-4 pb-[calc(5.75rem+env(safe-area-inset-bottom))] sm:pb-[calc(7.5rem+env(safe-area-inset-bottom))] lg:grid-cols-2 lg:content-start lg:items-start lg:gap-16 lg:px-12 lg:pb-0 lg:pt-[7vh]">
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

          <h1 id="home-hero-title" className="mt-4 sm:mt-6 font-display text-[clamp(2.4rem,min(5.4vw,8.5svh),5rem)] max-lg:[@media(max-height:620px)]:text-[2rem] font-normal leading-[1.03] tracking-[-0.015em] text-on-surface">
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
              className="hero-spring group inline-flex min-h-[50px] items-center justify-center gap-2 rounded-lg border border-on-surface/15 bg-surface-container-lowest px-4 text-[13px] sm:min-h-[54px] sm:gap-3 sm:px-7 sm:text-[14px] font-semibold uppercase tracking-[0.12em] text-on-surface hover:border-on-surface/40 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-on-surface"
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
        </div>

        {/* the way on down: fills as the lily closes, and fades once it is a bud */}
        {!reduce && (
          <motion.a
            href="#all-products-title"
            style={{ opacity: cueOpacity }}
            className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[12px] font-medium uppercase tracking-[0.24em] text-on-surface-variant hover:text-tertiary lg:flex"
          >
            Scroll
            <span aria-hidden="true" className="relative block h-10 w-px overflow-hidden bg-outline-variant/70">
              <motion.span style={{ scaleY: cueFill }} className="absolute inset-0 block origin-top bg-[#d4af37]" />
            </span>
          </motion.a>
        )}
      </div>
    </section>
  )
}
