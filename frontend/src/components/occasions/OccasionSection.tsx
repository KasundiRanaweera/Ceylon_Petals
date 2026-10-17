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
    <section className={`w-full py-12 ${shaded ? 'bg-surface-container-low' : 'bg-surface'}`}>
      <div className="max-w-7xl mx-auto px-4 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-2">
          <div>
            <h2 className="font-display text-headline-lg text-primary">{occasion.name}</h2>
            <p className="text-body-md text-secondary max-w-xl mt-1">{occasion.description}</p>
          </div>
          <Link to={`/shop?occasion=${occasion.slug}`} className="inline-flex items-center gap-1 text-label-md text-primary hover:underline whitespace-nowrap">
            See all {products ? `(${products.length})` : ''} <ArrowRight size={15} />
          </Link>
        </div>
        <ProductGrid products={shown} loading={!products} columns="wide" />
      </div>
    </section>
  )
}
