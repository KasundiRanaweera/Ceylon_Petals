import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { listCategories, listProducts } from '../../services/catalog'
import { sizedImage } from '../../lib/images'
import { fadeUp, staggerContainer } from '../motion/variants'

// The shop's main categories, as tall photo cards with the name and how many products each holds.
// Categories and their photos come from the owner's catalogue (Admin -> Categories).
export default function CategoryShowcase() {
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: listCategories })
  const { data: products } = useQuery({ queryKey: ['products', {}], queryFn: () => listProducts() })

  return (
    <section aria-labelledby="categories-title" className="bg-surface py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-12">
        <div className="mb-10 text-center lg:mb-12">
          <p className="text-[13px] font-medium uppercase tracking-[0.22em] text-tertiary">Shop by category</p>
          <h2 id="categories-title" className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] leading-tight text-on-surface">
            Find the right flowers
          </h2>
        </div>

        {categories ? (
          <motion.ul
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            variants={staggerContainer(0.07)}
            className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 xl:grid-cols-6"
          >
            {categories.map((c) => {
              const total = products?.filter((p) => p.categoryId === c.slug).length
              return (
                <motion.li key={c.id} variants={fadeUp}>
                  <Link
                    to={`/products/${c.slug}`}
                    className="group relative block aspect-[3/4] overflow-hidden rounded-2xl bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-tertiary"
                  >
                    {c.imageUrl && (
                      <img
                        src={sizedImage(c.imageUrl, 640)}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06] motion-reduce:transition-none"
                      />
                    )}
                    <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,18,17,0)_45%,rgba(20,18,17,0.72)_100%)]" />
                    <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4">
                      <span className="min-w-0">
                        <span className="block font-display text-[19px] leading-tight text-white sm:text-[21px]">{c.name}</span>
                        <span className="mt-1 block text-[13px] text-white/80">{total === undefined ? ' ' : `${total} ${total === 1 ? 'item' : 'items'}`}</span>
                      </span>
                      <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/90 text-[#1b1c1c] transition-colors group-hover:bg-[#d4af37]">
                        <ArrowUpRight size={17} />
                      </span>
                    </span>
                  </Link>
                </motion.li>
              )
            })}
          </motion.ul>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 xl:grid-cols-6" aria-busy="true" aria-label="Loading categories">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-surface-container" />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
