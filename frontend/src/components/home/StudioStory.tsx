import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { useShop } from '../../hooks/useShop'
import { EASE_OUT, fadeUp, staggerContainer, wordRise } from '../motion/variants'

const HEADLINE = 'Hand-tied in Colombo, grown in the hills'
const BADGE = 'Hand-tied in Colombo · Cut fresh daily · '

// The studio story: an arched studio photo with a smaller print overlapping it, beside a short text.
// The arch photo is a 614 x 768 crop, so it is framed at a size it stays sharp at instead of
// filling half the screen. On scroll-in the arch opens upwards and the print rises into place; while
// scrolling past, the two drift at different speeds. A round badge turns slowly at the corner.
export default function StudioStory() {
  const { shopName } = useShop()
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const photoY = useTransform(scrollYProgress, [0, 1], ['-6%', '6%'])
  const printY = useTransform(scrollYProgress, [0, 1], [60, -60])
  const reveal = reduce ? false : 'hidden'
  const initials = shopName.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <section ref={ref} aria-labelledby="story-title" className="overflow-hidden bg-surface py-20 lg:py-28">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 sm:px-12 lg:grid-cols-[1.05fr_1fr] lg:gap-20 lg:px-12">
        {/* The scroll trigger sits on this wrapper, not on the arch: an element clipped to nothing by
            clip-path never counts as in view, so the arch would never open. */}
        <motion.div
          className="relative mx-auto w-full max-w-[460px] pb-16 sm:pb-20 lg:mx-0 lg:ml-auto"
          initial={reveal}
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          {/* Thin gold outline set off behind the arch. */}
          <div aria-hidden="true" className="absolute inset-x-0 top-0 bottom-16 translate-x-4 -translate-y-4 rounded-t-full border border-tertiary-container/60 sm:bottom-20 sm:translate-x-6 sm:-translate-y-6" />

          <motion.div
            className="relative aspect-[4/5] overflow-hidden rounded-t-full bg-primary shadow-[0_40px_70px_-40px_rgba(48,48,48,0.7)]"
            variants={{
              hidden: { clipPath: 'inset(100% 0% 0% 0%)' },
              show: { clipPath: 'inset(0% 0% 0% 0%)', transition: { duration: 1.1, ease: EASE_OUT } },
            }}
          >
            <motion.img
              src="/images/home/studio-roses-614.webp"
              alt="Gloved hands cutting a pink rose in the misty hill country"
              loading="lazy"
              style={reduce ? undefined : { y: photoY }}
              className="absolute inset-x-0 -top-[8%] h-[116%] w-full object-cover"
              variants={{ hidden: { scale: 1.15 }, show: { scale: 1, transition: { duration: 1.4, ease: EASE_OUT } } }}
            />
          </motion.div>

          <motion.div style={reduce ? undefined : { y: printY }} className="absolute -right-2 bottom-0 w-[44%] sm:-right-10">
            <motion.img
              src="/images/products/kraft-wrapped-carnation-bunch-640.webp"
              srcSet="/images/products/kraft-wrapped-carnation-bunch-640.webp 640w, /images/products/kraft-wrapped-carnation-bunch-1280.webp 1280w"
              sizes="(min-width: 640px) 210px, 44vw"
              alt="A kraft-wrapped bouquet of carnations and roses held in hand"
              loading="lazy"
              className="aspect-[3/4] w-full border-[6px] border-surface-container-lowest object-cover shadow-[0_30px_50px_-28px_rgba(48,48,48,0.75)]"
              variants={{
                hidden: { opacity: 0, y: 60, rotate: 0 },
                show: { opacity: 1, y: 0, rotate: 4, transition: { duration: 0.7, ease: EASE_OUT, delay: 0.45 } },
              }}
            />
          </motion.div>

          {/* Slowly turning round badge. */}
          <div aria-hidden="true" className="absolute -left-3 bottom-6 grid size-28 place-items-center rounded-full bg-ink text-[#e9c349] shadow-lg sm:-left-8 sm:size-32">
            <motion.svg
              viewBox="0 0 100 100"
              className="absolute inset-0 size-full"
              animate={reduce ? undefined : { rotate: 360 }}
              transition={{ duration: 24, ease: 'linear', repeat: Infinity }}
            >
              <defs>
                <path id="badge-circle" d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0" />
              </defs>
              <text className="fill-current text-[7px] uppercase tracking-[0.14em]">
                <textPath href="#badge-circle">{BADGE}</textPath>
              </text>
            </motion.svg>
            <span className="font-display text-2xl italic">{initials}</span>
          </div>
        </motion.div>

        <motion.div
          className="max-w-lg"
          initial={reveal}
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          variants={staggerContainer(0.1)}
        >
          <motion.p variants={fadeUp} className="flex items-center gap-4 text-[13px] font-medium uppercase tracking-[0.22em] text-tertiary">
            <motion.span
              aria-hidden="true"
              className="h-px w-10 origin-left bg-tertiary"
              variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 0.6, ease: EASE_OUT } } }}
            />
            Our Colombo studio
          </motion.p>
          <h2 id="story-title" aria-label={HEADLINE} className="mt-5 font-display text-[clamp(2rem,4vw,3.25rem)] leading-[1.1] text-on-surface">
            <motion.span aria-hidden="true" className="block" variants={staggerContainer(0.05)}>
              {HEADLINE.split(' ').map((w, i) => (
                <span key={i} className="inline-block overflow-hidden pb-1 align-bottom">
                  <motion.span variants={wordRise} className={`inline-block ${w === 'hills' ? 'italic' : ''}`}>
                    {w}&nbsp;
                  </motion.span>
                </span>
              ))}
            </motion.span>
          </h2>
          <motion.p variants={fadeUp} className="mt-8 text-[16px] leading-[1.85] text-on-surface-variant">
            {shopName} is a flower studio in Colombo. Every bouquet is hand-tied in the studio from flowers
            cut fresh in Sri Lanka's hill country, then delivered with a handwritten card.
          </motion.p>
          <motion.p variants={fadeUp} className="mt-5 text-[16px] leading-[1.85] text-on-surface-variant">
            We pair local tropical blooms with contemporary design, for birthdays, Poruwa ceremonies and every quiet moment in between.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Link
              to="/about"
              className="group mt-10 inline-flex min-h-[44px] items-center gap-3 rounded-full border border-on-surface/20 px-6 text-[15px] text-on-surface transition-colors hover:border-tertiary hover:bg-tertiary hover:text-on-tertiary"
            >
              Explore our story
              <ArrowRight size={18} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
