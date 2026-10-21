import { useRef, useState, type PointerEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import { ArrowRight, PenLine } from 'lucide-react'
import { EASE_OUT } from '../motion/variants'

// The section after the blooming hero: the hand-held bouquet (cut out, no background) standing in a
// soft gold arch, with a film of our bouquets playing inside the arch behind it, beside a short line
// about our bouquets and the two ways in.
//
// Motion, once the section scrolls into view: the arch opens upward and its gold outline is drawn
// in; the bouquet rises into place, then sways and follows the mouse a little (the arch moves the
// other way, for depth); a few petals drift down; the words rise in. With reduced motion, the film
// is a still photo and nothing moves by itself.

const BOUQUET = { small: '/images/home/hero-bouquet-720.webp', large: '/images/home/hero-bouquet-1200.webp' }
const FILM = { large: '/videos/hero-bouquets.mp4', small: '/videos/hero-bouquets-540.mp4', poster: '/videos/hero-bouquets-poster.jpg' }
const PETALS = [
  { left: '18%', duration: '11s', delay: '2.2s', drift: '26px', size: 14 },
  { left: '38%', duration: '13s', delay: '5.5s', drift: '-22px', size: 11 },
  { left: '62%', duration: '10s', delay: '3.4s', drift: '30px', size: 13 },
  { left: '80%', duration: '12.5s', delay: '7.8s', drift: '-18px', size: 10 },
]

export default function BouquetFeature() {
  const reduce = useReducedMotion()
  const section = useRef<HTMLElement>(null)
  const inView = useInView(section, { once: true, amount: 0.35 })
  const live = inView && !reduce
  const play = <T,>(target: T) => (inView ? target : undefined)

  const { scrollYProgress } = useScroll({ target: section, offset: ['start end', 'end start'] })
  const bouquetScrollY = useTransform(scrollYProgress, [0, 1], ['6%', '-6%'])
  // the lighter film for small screens, chosen once
  const [filmSrc] = useState(() => (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches ? FILM.small : FILM.large))

  // the pointer's place over the section, from -1 to 1 on each axis, eased with a soft spring
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

  const rise = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 22 },
    animate: play({ opacity: 1, y: 0 }),
    transition: { duration: 0.75, delay, ease: EASE_OUT },
  })

  return (
    <section
      ref={section}
      onPointerMove={followPointer}
      onPointerLeave={resetPointer}
      aria-labelledby="bouquet-feature-title"
      className="hero-glow relative overflow-hidden bg-surface bg-[radial-gradient(60%_55%_at_15%_15%,rgba(252,228,236,0.75)_0%,rgba(252,228,236,0)_70%),radial-gradient(50%_60%_at_95%_90%,rgba(233,195,73,0.14)_0%,rgba(233,195,73,0)_70%)] py-16 lg:py-24"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 lg:grid-cols-2 lg:gap-16 lg:px-12">
        {/* ---- the bouquet, rising from its gold arch ---- */}
        <div className="relative mx-auto aspect-[4/5] w-full max-w-[290px] sm:max-w-[360px] lg:max-w-[460px]">
          <motion.div aria-hidden="true" className="absolute inset-x-[7%] inset-y-0" style={live ? { x: archX, y: archY } : undefined}>
            {/* the arch opens upward; inside it a soft film of our bouquets plays behind the cut-out bouquet */}
            <motion.div
              initial={reduce ? false : { clipPath: 'inset(100% 0% 0% 0% round 999px 999px 0 0)' }}
              animate={play({ clipPath: 'inset(0% 0% 0% 0% round 999px 999px 0 0)' })}
              transition={{ duration: 1.3, delay: 0.1, ease: [0.65, 0, 0.35, 1] }}
              className="absolute inset-0 overflow-hidden rounded-t-full bg-[linear-gradient(180deg,#f7ecd6_0%,#f6e6e9_70%,#f3e3e6_100%)] dark:bg-[linear-gradient(180deg,#2a2422_0%,#241f20_100%)]"
            >
              {reduce ? (
                <img src={FILM.poster} alt="" loading="lazy" className="h-full w-full scale-110 object-cover" />
              ) : (
                inView && <video className="h-full w-full scale-110 object-cover" src={filmSrc} poster={FILM.poster} autoPlay muted loop playsInline preload="none" />
              )}
              {/* a cream wash, so the film stays soft and the bouquet in front stands out */}
              <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(247,236,214,0.45)_0%,rgba(246,230,233,0.55)_60%,rgba(243,227,230,0.85)_100%)] dark:bg-[linear-gradient(180deg,rgba(20,19,18,0.35)_0%,rgba(20,19,18,0.5)_60%,rgba(20,19,18,0.8)_100%)]" />
            </motion.div>
            {/* the gold outline is drawn in from the base up, after the panel */}
            <motion.span
              initial={reduce ? false : { clipPath: 'inset(100% 0% 0% 0%)' }}
              animate={play({ clipPath: 'inset(0% 0% 0% 0%)' })}
              transition={{ duration: 1.6, delay: 0.4, ease: [0.65, 0, 0.35, 1] }}
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
                sizes="(min-width: 1024px) 560px, (min-width: 640px) 430px, 350px"
                alt="A hand holding a bouquet of pink roses, peach peonies, daisies and yellow tansy"
                loading="lazy"
                initial={reduce ? false : { opacity: 0, y: 40, scale: 0.94 }}
                animate={play({ opacity: 1, y: 0, scale: 1 })}
                transition={{ type: 'spring', bounce: 0.2, visualDuration: 1, delay: 0.35 }}
                className={`hero-bouquet relative w-full drop-shadow-[0_30px_40px_rgba(107,90,96,0.25)] ${live ? 'hero-bouquet-sway' : ''}`}
              />
            </motion.div>
          </motion.div>
        </div>

        {/* ---- the words ---- */}
        <div className="max-w-xl lg:justify-self-start">
          <motion.h2 {...rise(0.25)} id="bouquet-feature-title" className="font-display text-[clamp(2.2rem,4.4vw,3.75rem)] leading-[1.05] tracking-[-0.015em] text-on-surface">
            Hand-tied for every <span className="hero-bloom italic">moment</span>
          </motion.h2>
          <motion.p {...rise(0.4)} className="mt-5 text-[16px] leading-[1.75] text-on-surface-variant sm:text-[17px]">
            Every bouquet is gathered by hand in our Colombo studio on the morning it goes out: garden roses, peonies, daisies and
            whatever is best that week, wrapped and finished with your card.
          </motion.p>
          <motion.div {...rise(0.55)} className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/products/fresh-bouquets"
              className="hero-spring btn-gradient group inline-flex min-h-[52px] items-center justify-center gap-2 px-7 text-[13.5px] font-semibold uppercase tracking-[0.14em]"
            >
              Shop bouquets
              <ArrowRight size={17} aria-hidden="true" className="transition-transform duration-300 ease-out group-hover:translate-x-1 motion-reduce:transition-none" />
            </Link>
            <Link
              to="/custom-order"
              className="hero-spring inline-flex min-h-[52px] items-center justify-center gap-2 rounded-lg border border-on-surface/15 bg-surface-container-lowest px-6 text-[13.5px] font-semibold uppercase tracking-[0.12em] text-on-surface hover:border-on-surface/40 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-on-surface"
            >
              <PenLine size={17} aria-hidden="true" className="text-tertiary" /> Design your own
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
