import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { ChevronDown } from 'lucide-react'
import { EASE_OUT } from '../motion/variants'

const MotionLink = motion.create(Link)

// The first screen, as in the Stitch design: a full-screen rose photo (slightly darkened, drifting
// with a gentle parallax as you scroll) with the words centred on top, a gold "Explore the Atelier"
// button, a glass "Wedding Collections" button and a scroll cue.
const rise = (delay: number) => ({
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 1, delay, ease: EASE_OUT },
})

export default function Hero() {
  const reduce = useReducedMotion()
  const section = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end start'] })
  const photoY = useTransform(scrollYProgress, [0, 1], ['0%', '18%'])

  return (
    <section
      ref={section}
      aria-labelledby="home-hero-title"
      className="relative flex h-[calc(100svh-101px)] min-h-[560px] w-full items-center justify-center overflow-hidden bg-[#1b1c1c] lg:h-[calc(100svh-109px)]"
    >
      {/* the photo: scaled up a little so the parallax never shows an edge */}
      <motion.div className="absolute inset-0 scale-110" style={reduce ? undefined : { y: photoY }}>
        <img
          src="/images/stitch/hero-roses-2000.webp"
          srcSet="/images/stitch/hero-roses-1200.webp 1200w, /images/stitch/hero-roses-2000.webp 2000w"
          sizes="100vw"
          alt="Soft pink and cream roses with dewdrops"
          fetchPriority="high"
          className="h-full w-full object-cover brightness-[0.7]"
        />
      </motion.div>
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/35" />

      <div className="relative z-10 max-w-4xl px-5 text-center text-[#fffdf9]">
        <motion.p {...rise(0.2)} className="mb-5 text-[12px] font-medium uppercase tracking-[0.4em] sm:text-[13px]">
          Luxury botanical artistry
        </motion.p>
        <motion.h1 {...rise(0.4)} id="home-hero-title" className="font-display text-[clamp(2.75rem,8vw,5.5rem)] leading-[1.05] tracking-[-0.01em]">
          The Art of Living Bloom
        </motion.h1>
        <motion.p {...rise(0.7)} className="mx-auto mb-12 mt-6 max-w-2xl text-[17px] leading-relaxed text-[#fffdf9]/90 sm:text-[19px]">
          Exquisite floral curation for Sri Lanka&rsquo;s most discerning moments. Where elegance meets the ephemeral.
        </motion.p>
        <motion.div {...rise(1)} className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          <MotionLink
            to="/shop"
            whileHover={reduce ? undefined : { scale: 1.05 }}
            className="inline-flex min-h-[56px] items-center rounded-full bg-[#d4af37] px-12 text-[13px] font-semibold uppercase tracking-[0.16em] text-[#1b1c1c] shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Explore the Atelier
          </MotionLink>
          <Link
            to="/wedding-events"
            className="inline-flex min-h-[56px] items-center rounded-full border border-white/30 bg-white/10 px-12 text-[13px] font-semibold uppercase tracking-[0.16em] text-[#fffdf9] shadow-lg backdrop-blur-md transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Wedding Collections
          </Link>
        </motion.div>
      </div>

      <a
        href="#occasions-title"
        aria-label="Scroll to the collections"
        className="absolute bottom-8 left-1/2 z-20 flex h-11 w-11 -translate-x-1/2 items-center justify-center text-[#fffdf9]/75 hover:text-white"
      >
        <ChevronDown size={30} className="animate-bounce motion-reduce:animate-none" />
      </a>
    </section>
  )
}
