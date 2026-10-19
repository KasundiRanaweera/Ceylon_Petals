import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue, type Variants } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { useShop } from '../../hooks/useShop'
import { EASE_OUT, fadeUp, staggerContainer } from '../motion/variants'

// "Moments on Instagram": six photos laid out like prints scattered on a table. As the section
// scrolls in they are dealt out from a stack into a loose fan; while scrolling past, alternate prints
// drift up and down a little; on hover a print straightens and lifts. It links to the shop's
// Instagram when the owner has added one (Admin -> Settings -> Storefront); without a link it is just
// a gallery. With reduced motion the prints simply sit in their fan.
const PHOTOS = [
  { img: 'ig-1', caption: 'Coral garden roses' },
  { img: 'ig-2', caption: 'Chamomile, still life' },
  { img: 'ig-3', caption: 'A single dahlia' },
  { img: 'shop-4', caption: 'White tulips at noon' },
  { img: 'ig-5', caption: 'Ivory tulip' },
  { img: 'ig-6', caption: 'Blush & ribbon' },
]

// Resting tilt (degrees) and vertical offset (px) of each print in the fan.
const TILT = [-7, 4, -3, 5, -4, 6]
const LIFT = [18, -10, 26, -16, 12, -6]

function handleOf(url: string): string {
  try {
    const path = new URL(url).pathname.split('/').filter(Boolean)[0]
    return path ? `@${path.replace(/^@/, '')}` : ''
  } catch {
    return ''
  }
}

// Dealt from a stack in the middle of the row out to each print's place in the fan.
const deal: Variants = {
  hidden: (i: number) => ({ opacity: 0, x: `${(2.5 - i) * 70}%`, y: 80, rotate: 0, scale: 0.9 }),
  show: (i: number) => ({
    opacity: 1,
    x: 0,
    y: LIFT[i],
    rotate: TILT[i],
    scale: 1,
    transition: { duration: 0.6, ease: EASE_OUT, delay: 0.1 + i * 0.07 },
  }),
}

function Print({ index, progress, href }: { index: number; progress: MotionValue<number>; href: string | null }) {
  const reduce = useReducedMotion()
  const { img, caption } = PHOTOS[index]
  const drift = useTransform(progress, [0, 1], index % 2 ? [-28, 28] : [28, -28])

  const card = (
    <motion.figure
      custom={index}
      variants={deal}
      whileHover={reduce ? undefined : { rotate: 0, y: LIFT[index] - 14, scale: 1.06, transition: { duration: 0.35, ease: EASE_OUT } }}
      className="bg-surface-container-lowest p-2 pb-3 shadow-[0_22px_40px_-24px_rgba(48,48,48,0.55)] transition-shadow duration-300 group-hover:shadow-[0_34px_60px_-26px_rgba(48,48,48,0.6)] sm:p-2.5 sm:pb-4"
    >
      <div className="aspect-square overflow-hidden bg-surface-container">
        <img
          src={`/images/stitch/${img}.webp`}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 motion-reduce:transition-none"
        />
      </div>
      <figcaption className="mt-2.5 truncate text-center font-display text-[13px] italic text-on-surface-variant sm:mt-3 sm:text-[15px]">
        {caption}
      </figcaption>
    </motion.figure>
  )

  return (
    <motion.li style={reduce ? undefined : { y: drift }} className="group relative w-full hover:z-10 focus-within:z-10 sm:-mx-3 sm:w-[21vw] sm:max-w-[250px] lg:-mx-5">
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`${caption} — open our Instagram`} className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-tertiary">
          {card}
        </a>
      ) : (
        card
      )}
    </motion.li>
  )
}

export default function InstagramStrip() {
  const { instagramUrl } = useShop()
  const handle = instagramUrl ? handleOf(instagramUrl) : ''
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })

  return (
    <section ref={ref} aria-labelledby="instagram-title" className="overflow-hidden bg-surface py-20 lg:py-28">
      <motion.div
        className="px-4 text-center"
        initial={reduce ? false : 'hidden'}
        whileInView="show"
        viewport={{ once: true, amount: 0.6 }}
        variants={staggerContainer(0.08)}
      >
        <motion.p variants={fadeUp} className="text-[13px] font-medium uppercase tracking-[0.3em] text-tertiary">
          Moments on Instagram
        </motion.p>
        <motion.h2 variants={fadeUp} id="instagram-title" className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] leading-tight text-on-surface">
          Petals, <span className="italic">in passing</span>
        </motion.h2>
        {instagramUrl && (
          <motion.a
            variants={fadeUp}
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-1.5 border-b border-on-surface-variant pb-1 text-[15px] text-on-surface-variant transition-colors hover:border-tertiary hover:text-tertiary"
          >
            Follow {handle || 'us on Instagram'} <ArrowUpRight size={16} aria-hidden="true" />
          </motion.a>
        )}
      </motion.div>

      <motion.ul
        className="mx-auto mt-14 grid max-w-7xl grid-cols-2 gap-x-4 gap-y-8 px-6 sm:mt-16 sm:flex sm:justify-center sm:px-8"
        initial={reduce ? false : 'hidden'}
        whileInView="show"
        viewport={{ once: true, amount: 0.25 }}
      >
        {PHOTOS.map((p, i) => (
          <Print key={p.img} index={i} progress={scrollYProgress} href={instagramUrl || null} />
        ))}
      </motion.ul>
    </section>
  )
}
