import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { listCategories, listProducts } from '../../services/catalog'
import { OCCASIONS } from '../../data/catalog'
import { fadeUp, staggerContainer } from '../motion/variants'
import { sizedImage } from '../../lib/images'
import SectionHeading from '../ui/SectionHeading'

export default function CategoryGrid() {
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: listCategories })
  const { data: products } = useQuery({ queryKey: ['products', {}], queryFn: () => listProducts() })
  const countFor = (id: string) => products?.filter((p) => p.categoryId === id).length

  return (
    <section className="w-full bg-surface py-20">
      <div className="mx-auto max-w-7xl space-y-10 px-4 lg:px-12">
        <SectionHeading
          title="Shop by category"
          highlight="category"
          description="Seasonal blooms, gourmet hampers and living plants — all prepared in Colombo on the day of delivery."
          action={{ label: 'Shop everything', to: '/shop' }}
        />

        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          variants={staggerContainer(0.07)}
        >
          {(categories ?? []).map((cat) => (
            <motion.div key={cat.id} variants={fadeUp} className="aspect-[4/3]">
              <Link
                to={`/products/${cat.slug}`}
                className="group relative flex h-full overflow-hidden rounded-2xl bg-surface-container shadow-sm transition-shadow duration-300 hover:shadow-[0_30px_60px_-25px_rgba(12,10,9,0.4)]"
              >
                <img
                  src={sizedImage(cat.imageUrl, 1408)}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
                <div className="relative mt-auto flex w-full items-end justify-between gap-3 p-6">
                  <div>
                    {countFor(cat.id) !== undefined && (
                      <span className="mb-2 inline-block rounded-sm bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-md">
                        {countFor(cat.id)} {countFor(cat.id) === 1 ? 'item' : 'items'}
                      </span>
                    )}
                    <h3 className="font-display text-[28px] leading-tight text-white">{cat.name}</h3>
                    <p className="mt-1 line-clamp-1 max-w-sm text-body-sm text-white/75">{cat.description}</p>
                  </div>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-primary transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1">
                    <ArrowUpRight size={20} />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <div className="flex flex-col gap-3 rounded-2xl bg-surface-container-low p-6 md:flex-row md:items-center">
          <h3 className="font-display text-headline-sm text-primary md:mr-4 md:shrink-0">Shop by occasion</h3>
          <div className="flex flex-wrap gap-2">
            {OCCASIONS.map((o) => (
              <Link
                key={o.slug}
                to={`/shop?occasion=${o.slug}`}
                className="rounded-sm border border-outline-variant bg-surface-container-lowest px-4 py-2 text-[12px] font-medium uppercase tracking-[0.14em] text-primary transition-colors hover:border-primary hover:bg-primary hover:text-[#f5e6c8]"
              >
                {o.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
