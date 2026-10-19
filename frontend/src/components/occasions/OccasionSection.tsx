import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import ProductGrid from '../shop/ProductGrid'
import type { Occasion, Product } from '../../types'

interface OccasionSectionProps {
  occasion: Occasion
  products: Product[] | undefined
  /** Show only the first few, with a "See all" link (used on the "All occasions" tab). */
  limit?: number
  shaded?: boolean
}

export default function OccasionSection({ occasion, products, limit, shaded = false }: OccasionSectionProps) {
  const shown = limit ? products?.slice(0, limit) : products
  if (products && products.length === 0) return null

  return (
    <section className={`w-full py-16 lg:py-20 ${shaded ? 'bg-surface-container-low' : 'bg-surface'}`}>
      <div className="max-w-7xl mx-auto px-4 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="font-display text-[clamp(2rem,4vw,3rem)] leading-tight text-on-surface">{occasion.name}</h2>
            <p className="text-[15px] leading-relaxed text-on-surface-variant max-w-xl mt-3">{occasion.description}</p>
          </div>
          <Link to={`/shop?occasion=${occasion.slug}`} className="inline-flex items-center gap-1 self-start text-[15px] border-b border-on-surface-variant pb-1 text-on-surface-variant transition-colors hover:border-tertiary hover:text-tertiary whitespace-nowrap md:self-auto">
            See all {products ? `(${products.length})` : ''} <ArrowRight size={15} />
          </Link>
        </div>
        <ProductGrid products={shown} loading={!products} columns="wide" />
      </div>
    </section>
  )
}
