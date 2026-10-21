import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { OCCASIONS } from '../../data/occasions'
import { listProducts } from '../../services/catalog'
import { sizedImage } from '../../lib/images'
import { EASE_OUT } from '../motion/variants'
import type { OccasionSlug, Product } from '../../types'

// "Flowers for every occasion": a mosaic of the shop's occasions. Wedding & Poruwa is the large
// feature tile; one wide tile and six squares fill the rest. Each tile shows one of our own
// products for that occasion (sharp photos, not stock images) and how many products it holds,
// and opens the shop filtered to it.
//
// Motion: as the mosaic scrolls into view, each tile opens upward in turn and its photo settles
// from a slight zoom. On hover the photo slowly zooms, the shade deepens, the name lifts and an
// arrow appears. With reduced motion the tiles simply appear.

// Which product's photo stands for each occasion, and where the tile sits in the mosaic.
const TILES: { slug: OccasionSlug; product: string; size: 'feature' | 'wide' | 'square' }[] = [
  { slug: 'wedding', product: 'poruwa-blush-bridal-bouquet', size: 'feature' },
  { slug: 'love', product: 'the-colombo-velvet-grandeur', size: 'square' },
  { slug: 'birthday', product: 'sunburst-morning-jubilee', size: 'square' },
  { slug: 'anniversary', product: 'victoria-pavilion-velvet-box', size: 'square' },
  { slug: 'congratulations', product: 'golden-orchid-cascade', size: 'square' },
  { slug: 'sympathy', product: 'serenity-mountain-casablanca', size: 'wide' },
  { slug: 'get-well', product: 'pastel-dawn-cottage-bunch', size: 'square' },
  { slug: 'corporate', product: 'the-heritage-ceylon-sovereign-crate', size: 'square' },
]

const SPAN = {
  feature: 'col-span-2 row-span-2',
  wide: 'col-span-2',
  square: '',
}

/** The chosen product's photo, or the first product for that occasion if it is no longer in the shop. */
function photoFor(products: Product[], slug: OccasionSlug, preferred: string): string | undefined {
  const chosen = products.find((p) => p.slug === preferred) ?? products.find((p) => p.occasions.includes(slug))
  return chosen?.images[0]
}

export default function OccasionTiles() {
  const reduce = useReducedMotion()
  const { data: products } = useQuery({ queryKey: ['products', {}], queryFn: () => listProducts() })
  const name = (slug: OccasionSlug) => OCCASIONS.find((o) => o.slug === slug)?.name ?? slug

  return (
    <section aria-labelledby="occasions-title" className="bg-surface py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-12">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:mb-12">
          <div>
            <p className="text-[13px] font-medium uppercase tracking-[0.22em] text-tertiary">Shop by occasion</p>
            <h2 id="occasions-title" className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] leading-tight text-on-surface">
              Flowers for every occasion
            </h2>
          </div>
          <Link to="/products/occasions" className="self-start border-b border-on-surface-variant pb-1 text-[15px] text-on-surface-variant transition-colors hover:border-tertiary hover:text-tertiary sm:self-auto">
            All occasions
          </Link>
        </div>

        <motion.ul
          className="grid auto-rows-[150px] grid-cols-2 gap-3 sm:auto-rows-[190px] sm:gap-4 lg:auto-rows-[210px] lg:grid-cols-4"
          initial={reduce ? false : 'hidden'}
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        >
          {TILES.map((t) => {
            const src = products ? photoFor(products, t.slug, t.product) : undefined
            const count = products?.filter((p) => p.occasions.includes(t.slug)).length
            const big = t.size === 'feature'
            return (
              <motion.li
                key={t.slug}
                className={SPAN[t.size]}
                variants={{
                  hidden: { clipPath: 'inset(100% 0% 0% 0% round 18px)' },
                  show: { clipPath: 'inset(0% 0% 0% 0% round 18px)', transition: { duration: 0.9, ease: EASE_OUT } },
                }}
              >
                <Link
                  to={`/shop?occasion=${t.slug}`}
                  className="group relative block h-full overflow-hidden rounded-[18px] bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-tertiary"
                >
                  {/* the wrapper zooms slowly on hover; the photo inside settles in on scroll */}
                  <span className="absolute inset-0 transition-transform duration-[1200ms] ease-out group-hover:scale-[1.07] motion-reduce:transition-none">
                    {src && (
                      <motion.img
                        src={sizedImage(src, big ? 1280 : 640)}
                        alt=""
                        loading="lazy"
                        variants={{ hidden: { scale: 1.18 }, show: { scale: 1, transition: { duration: 1.3, ease: EASE_OUT } } }}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </span>
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,18,17,0)_40%,rgba(20,18,17,0.72)_100%)] transition-opacity duration-500 group-hover:opacity-90"
                  />
                  <span aria-hidden="true" className="absolute inset-0 bg-[#1b1c1c]/0 transition-colors duration-500 group-hover:bg-[#1b1c1c]/15" />

                  <span className={`absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 ${big ? 'p-5 sm:p-7' : 'p-4'}`}>
                    <span className="min-w-0 transition-transform duration-500 ease-out group-hover:-translate-y-1 motion-reduce:transition-none">
                      <span className={`block font-display leading-tight text-white ${big ? 'text-[26px] sm:text-[38px]' : 'text-[17px] sm:text-[21px]'}`}>
                        {name(t.slug)}
                      </span>
                      <span className="mt-1 block text-[12.5px] text-white/80 sm:text-[13px]">
                        {count === undefined ? (
                          ' '
                        ) : (
                          <>
                            {count} <span className={big ? '' : 'sm:hidden'}>{count === 1 ? 'item' : 'items'}</span>
                            <span className={big ? 'hidden' : 'hidden sm:inline'}>{count === 1 ? 'arrangement' : 'arrangements'}</span>
                          </>
                        )}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="flex h-9 w-9 shrink-0 translate-y-2 items-center justify-center rounded-full bg-white text-[#1b1c1c] opacity-0 transition-all duration-500 ease-out group-hover:translate-y-0 group-hover:bg-[#d4af37] group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 motion-reduce:transition-none sm:h-10 sm:w-10"
                    >
                      <ArrowUpRight size={18} />
                    </span>
                  </span>
                </Link>
              </motion.li>
            )
          })}
        </motion.ul>
      </div>
    </section>
  )
}
