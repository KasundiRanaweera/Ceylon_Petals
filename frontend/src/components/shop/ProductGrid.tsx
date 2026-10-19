import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import ProductCard from './ProductCard'
import { fadeUp, staggerContainer } from '../motion/variants'
import type { Product } from '../../types'

interface ProductGridProps {
  products: Product[] | undefined
  loading?: boolean
  /** Shown when there are no products. */
  empty?: ReactNode
  /**
   * 3: listings beside the filter sidebar (2 per row on phones, 3 from laptops).
   * 'wide': full-width listing pages (2 / 3 / 4 per row).
   * 4: the home page and related products.
   */
  columns?: 3 | 4 | 'wide'
}

export default function ProductGrid({ products, loading = false, empty, columns = 3 }: ProductGridProps) {
  const grid =
    columns === 4
      ? 'grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10'
      : columns === 'wide'
        ? 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10'
        : 'grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10'

  if (loading || !products) {
    return (
      <div className={grid} aria-busy="true" aria-label="Loading products">
        {Array.from({ length: columns === 3 ? 6 : 4 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square rounded-2xl bg-surface-container" />
            <div className="mt-3 h-5 w-3/4 rounded bg-surface-container" />
            <div className="mt-2 h-4 w-1/2 rounded bg-surface-container-low" />
          </div>
        ))}
      </div>
    )
  }

  if (products.length === 0) return <>{empty}</>

  // Cards rise in one after another as the grid scrolls into view (re-runs when the list changes).
  return (
    <motion.div
      key={products.map((p) => p.id).join()}
      className={grid}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.05 }}
      variants={staggerContainer(0.06)}
    >
      {products.map((product) => (
        <motion.div key={product.id} variants={fadeUp} className="flex">
          <ProductCard product={product} />
        </motion.div>
      ))}
    </motion.div>
  )
}
