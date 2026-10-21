import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { OCCASIONS } from '../../data/occasions'
import { listProducts } from '../../services/catalog'
import { sizedImage } from '../../lib/images'
import { EASE_OUT } from '../motion/variants'
import type { OccasionSlug, Product } from '../../types'

// "Flowers for every occasion" as an expanding-panel gallery.
//
// Large screens: all eight occasions stand side by side as tall photo panels. One is open, showing
// its photo, name, product count, a line about it and a "Shop" link; the others are slim strips
// with their name set vertically. Hovering or focusing a strip opens it (the panels glide to their
// new widths), and while nobody is interacting the open panel moves on by itself every few seconds.
// Phones and tablets: the same panels become a row of tall cards that swipe sideways.
//
// Each panel shows one of our own products for that occasion and a live count, and opens the shop
// filtered to it. With reduced motion nothing moves by itself and panels change without gliding.

const PANELS: { slug: OccasionSlug; product: string }[] = [
  { slug: 'wedding', product: 'poruwa-blush-bridal-bouquet' },
  { slug: 'love', product: 'the-colombo-velvet-grandeur' },
  { slug: 'birthday', product: 'sunburst-morning-jubilee' },
  { slug: 'anniversary', product: 'victoria-pavilion-velvet-box' },
  { slug: 'congratulations', product: 'golden-orchid-cascade' },
  { slug: 'sympathy', product: 'serenity-mountain-casablanca' },
  { slug: 'get-well', product: 'pastel-dawn-cottage-bunch' },
  { slug: 'corporate', product: 'the-heritage-ceylon-sovereign-crate' },
]

const AUTO_ADVANCE_MS = 4500

/** The chosen product's photo, or the first product for that occasion if it is no longer in the shop. */
function photoFor(products: Product[], slug: OccasionSlug, preferred: string): string | undefined {
  const chosen = products.find((p) => p.slug === preferred) ?? products.find((p) => p.occasions.includes(slug))
  return chosen?.images[0]
}

function countLabel(count: number | undefined) {
  if (count === undefined) return ' '
  return `${count} ${count === 1 ? 'arrangement' : 'arrangements'}`
}

export default function OccasionTiles() {
  const reduce = useReducedMotion()
  const { data: products } = useQuery({ queryKey: ['products', {}], queryFn: () => listProducts() })
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (reduce || paused) return
    const id = window.setInterval(() => setActive((i) => (i + 1) % PANELS.length), AUTO_ADVANCE_MS)
    return () => window.clearInterval(id)
  }, [reduce, paused])

  const panels = PANELS.map((p) => {
    const occasion = OCCASIONS.find((o) => o.slug === p.slug)
    return {
      ...p,
      name: occasion?.name ?? p.slug,
      description: occasion?.description ?? '',
      src: products ? photoFor(products, p.slug, p.product) : undefined,
      count: products?.filter((x) => x.occasions.includes(p.slug)).length,
    }
  })

  return (
    <section aria-labelledby="occasions-title" className="overflow-hidden bg-surface py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-12">
        <motion.div
          className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:mb-12"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
        >
          <div>
            <p className="text-[13px] font-medium uppercase tracking-[0.22em] text-tertiary">Shop by occasion</p>
            <h2 id="occasions-title" className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] leading-tight text-on-surface">
              Flowers for every occasion
            </h2>
          </div>
          <Link to="/products/occasions" className="self-start border-b border-on-surface-variant pb-1 text-[15px] text-on-surface-variant transition-colors hover:border-tertiary hover:text-tertiary sm:self-auto">
            All occasions
          </Link>
        </motion.div>

        {/* ---- large screens: expanding panels ---- */}
        <motion.ul
          data-occasion-panels
          className="hidden h-[520px] gap-3 lg:flex"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
          initial={reduce ? false : 'hidden'}
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
        >
          {panels.map((p, i) => {
            const open = i === active
            return (
              <motion.li
                key={p.slug}
                className="occasion-panel relative min-w-0 overflow-hidden rounded-[22px] bg-surface-container"
                style={{ flexGrow: open ? 5 : 1 }}
                onMouseEnter={() => setActive(i)}
                variants={{
                  hidden: { opacity: 0, y: 60 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE_OUT } },
                }}
              >
                <Link
                  to={`/shop?occasion=${p.slug}`}
                  onFocus={() => setActive(i)}
                  aria-label={`${p.name}: ${countLabel(p.count)}`}
                  className="group absolute inset-0 block focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white"
                >
                  {p.src && (
                    <img
                      src={sizedImage(p.src, 960)}
                      alt=""
                      loading="lazy"
                      className={`absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-out motion-reduce:transition-none ${open ? 'scale-100' : 'scale-110'}`}
                    />
                  )}
                  <span
                    aria-hidden="true"
                    className={`absolute inset-0 transition-colors duration-700 ${open ? 'bg-[linear-gradient(180deg,rgba(20,18,17,0)_25%,rgba(20,18,17,0.55)_55%,rgba(20,18,17,0.88)_100%)]' : 'bg-[#1b1c1c]/45 group-hover:bg-[#1b1c1c]/30'}`}
                  />

                  {/* closed: the name set vertically */}
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-0 bottom-6 flex justify-center transition-opacity duration-300 ${open ? 'opacity-0' : 'opacity-100 delay-200'}`}
                  >
                    <span className="rotate-180 whitespace-nowrap font-display text-[19px] text-white [writing-mode:vertical-rl]">{p.name}</span>
                  </span>

                  {/* open: count, name, description and the way in */}
                  <AnimatePresence>
                    {open && (
                      <motion.span
                        key="details"
                        aria-hidden="true"
                        className="absolute inset-x-0 bottom-0 block p-8"
                        initial={reduce ? false : { opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.25, ease: EASE_OUT } }}
                        exit={{ opacity: 0, transition: { duration: 0.15 } }}
                      >
                        <span className="inline-block rounded-full bg-[#1b1c1c]/55 px-3 py-1 text-[11.5px] font-medium uppercase tracking-[0.2em] text-[#f1d27b] backdrop-blur-sm">{countLabel(p.count)}</span>
                        <span className="mt-2 block font-display text-[40px] leading-[1.05] text-white">{p.name}</span>
                        <span className="mt-3 block max-w-sm text-[15px] leading-relaxed text-white/85">{p.description}</span>
                        <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-[#1b1c1c] transition-colors group-hover:bg-[#d4af37]">
                          Shop {p.name} <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                        </span>
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* the open panel's progress bar, showing when it moves on */}
                  {open && !reduce && !paused && (
                    <span aria-hidden="true" className="absolute inset-x-8 top-6 h-[2px] overflow-hidden rounded-full bg-white/25">
                      <span key={active} className="occasion-progress block h-full bg-[#e9c349]" style={{ animationDuration: `${AUTO_ADVANCE_MS}ms` }} />
                    </span>
                  )}
                </Link>
              </motion.li>
            )
          })}
        </motion.ul>

        {/* ---- phones and tablets: swipeable cards ---- */}
        <motion.ul
          className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden"
          initial={reduce ? false : 'hidden'}
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        >
          {panels.map((p) => (
            <motion.li
              key={p.slug}
              className="w-[72vw] max-w-[300px] shrink-0 snap-start"
              variants={{ hidden: { opacity: 0, x: 40 }, show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: EASE_OUT } } }}
            >
              <Link to={`/shop?occasion=${p.slug}`} className="group relative block aspect-[3/4] overflow-hidden rounded-[20px] bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-tertiary">
                {p.src && <img src={sizedImage(p.src, 640)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
                <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,18,17,0)_40%,rgba(20,18,17,0.78)_100%)]" />
                <span className="absolute inset-x-0 bottom-0 block p-5">
                  <span className="block text-[11px] font-medium uppercase tracking-[0.2em] text-[#e9c349]">{countLabel(p.count)}</span>
                  <span className="mt-1.5 block font-display text-[24px] leading-tight text-white">{p.name}</span>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-[13.5px] text-white/90">
                    Shop now <ArrowRight size={15} />
                  </span>
                </span>
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}
