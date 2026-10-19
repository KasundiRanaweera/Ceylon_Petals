import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Star, Truck, PenLine, Package } from 'lucide-react'
import { Petals } from '../motion/Ambient'
import { fadeUp, staggerContainer, EASE_OUT } from '../motion/variants'
import { PRODUCT_IMAGES } from '../../data/productImages'
import { useShop } from '../../hooks/useShop'
import { imageSrcSet, sizedImage } from '../../lib/images'

const SLIDES = [
  {
    image: PRODUCT_IMAGES['highland-blush-symphony'],
    quote: 'The roses arrived fresh and beautifully arranged — and lasted well over a week.',
    name: 'Dilshan K.',
    place: 'Colombo 05',
  },
  {
    image: PRODUCT_IMAGES['golden-orchid-cascade'],
    quote: 'Ordered from London for Amma’s birthday. They sent a photo the moment it was delivered.',
    name: 'Ananya P.',
    place: 'London → Nugegoda',
  },
  {
    image: PRODUCT_IMAGES['the-heritage-ceylon-sovereign-crate'],
    quote: 'Our client hampers were perfect, on time, and the invoice was ready the same day.',
    name: 'Rukshan F.',
    place: 'Battaramulla',
  },
]

const PERKS = [
  { icon: Package, text: 'Follow every order and its delivery' },
  { icon: Truck, text: 'Saved addresses for one-tap checkout' },
  { icon: PenLine, text: 'Your card messages, remembered' },
]

interface AuthLayoutProps {
  eyebrow: string
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

// Split-screen layout for sign in and register: a slowly changing photo with a customer note
// on the left (hidden on small screens) and the form on the right.
export default function AuthLayout({ eyebrow, title, subtitle, children, footer }: AuthLayoutProps) {
  const { shopName } = useShop()
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 6000)
    return () => clearInterval(id)
  }, [])

  const current = SLIDES[slide]

  return (
    <section className="relative bg-surface">
      <div className="mx-auto grid min-h-[calc(100vh-9rem)] max-w-7xl grid-cols-1 gap-8 px-4 py-10 lg:grid-cols-2 lg:gap-12 lg:px-12 lg:py-14">
        {/* Form side */}
        <motion.div className="flex flex-col justify-center lg:order-2" initial="hidden" animate="show" variants={staggerContainer(0.08)}>
          <div className="mx-auto w-full max-w-md rounded-xl bg-surface-container-lowest ring-1 ring-outline-variant/40 shadow-[0_18px_40px_-28px_rgba(48,48,48,0.35)] p-6 sm:p-10">
            <motion.p variants={fadeUp} className="text-[13px] font-medium uppercase tracking-[0.22em] text-tertiary">
              {eyebrow}
            </motion.p>
            <motion.h1 variants={fadeUp} className="mt-3 font-display text-[34px] sm:text-[40px] leading-[1.1] tracking-tight text-on-surface">
              {title}
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-3 text-body-md leading-relaxed text-on-surface-variant">
              {subtitle}
            </motion.p>
            <motion.div variants={fadeUp} className="mt-8">
              {children}
            </motion.div>
            {footer && (
              <motion.div variants={fadeUp} className="mt-8">
                {footer}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Showcase side */}
        <motion.aside
          aria-label={`Why customers love ${shopName}`}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
          className="relative hidden flex-col overflow-hidden rounded-xl bg-ink-gradient lg:order-1 ring-1 ring-outline-variant/40 shadow-[0_18px_40px_-28px_rgba(48,48,48,0.35)] lg:flex"
        >
          {/* Photo at its native 11:6 ratio — whole and sharp, never stretched to fill a tall panel. */}
          <div className="relative aspect-[11/6] overflow-hidden">
            <AnimatePresence initial={false}>
              <motion.img
                key={current.image}
                src={sizedImage(current.image, 1408)}
                srcSet={imageSrcSet(current.image)}
                sizes="(min-width: 1280px) 568px, 45vw"
                alt=""
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: EASE_OUT }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </AnimatePresence>
            <Link to="/" className="absolute left-5 top-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-black/45 px-4 py-2 text-label-md text-white backdrop-blur-md hover:bg-black/60">
              ← Back to {shopName}
            </Link>
          </div>

          <div className="relative flex flex-1 flex-col justify-between gap-8 p-8 xl:p-10">
            <Petals color="#e7c873" />
            <ul className="relative space-y-2.5">
              {PERKS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-body-md text-white/85">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d4af37]/60 text-tertiary-fixed-dim">
                    <Icon size={15} />
                  </span>
                  {text}
                </li>
              ))}
            </ul>

            <div className="relative border-t border-[#d4af37]/40 pt-6 text-white">
              <div className="flex gap-0.5 text-tertiary-fixed-dim" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.figure
                  key={slide}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: EASE_OUT }}
                  className="mt-3"
                >
                  <blockquote className="font-display text-[22px] italic leading-snug">“{current.quote}”</blockquote>
                  <figcaption className="eyebrow mt-3 text-white/60">
                    {current.name} · {current.place}
                  </figcaption>
                </motion.figure>
              </AnimatePresence>
              <div className="mt-5 flex gap-1.5" role="tablist" aria-label="Customer notes">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={i === slide}
                    aria-label={`Show note ${i + 1}`}
                    onClick={() => setSlide(i)}
                    className="h-0.5 cursor-pointer bg-white/30 transition-all"
                    style={{ width: i === slide ? 32 : 14, backgroundColor: i === slide ? '#e7c873' : undefined }}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.aside>
      </div>
    </section>
  )
}
