import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import ProductCard from '../shop/ProductCard'
import LoadError from '../ui/LoadError'
import { listProducts } from '../../services/catalog'

// Every product in the shop, in one row that scrolls by on its own. The row is drawn twice side by
// side and slides left by one copy's width, so it loops without a jump. It pauses while the mouse is
// over it or a card has keyboard focus. With reduced motion it stays still and can be scrolled by hand.
export default function ProductMarquee() {
  const { data: products, isError, refetch, isFetching } = useQuery({ queryKey: ['products', {}], queryFn: () => listProducts() })
  // In-stock first, so the row opens with things that can be ordered today.
  const items = [...(products ?? [])].sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0))
  // About four seconds per card keeps the pace calm whatever the catalogue size.
  const duration = `${Math.max(40, items.length * 4)}s`

  const row = (copy: boolean) => (
    <ul aria-hidden={copy || undefined} className="flex shrink-0 gap-5 pr-5 sm:gap-6 sm:pr-6">
      {items.map((p) => (
        <li key={p.id} className="w-[210px] shrink-0 sm:w-[250px]">
          <ProductCard product={p} copy={copy} sizes="250px" />
        </li>
      ))}
    </ul>
  )

  return (
    <section aria-labelledby="all-products-title" className="bg-surface-container-low py-16 lg:py-20">
      <div className="mx-auto mb-10 flex max-w-7xl flex-col gap-4 px-4 sm:flex-row sm:items-end sm:justify-between lg:px-12">
        <div>
          <p className="text-[13px] font-medium uppercase tracking-[0.22em] text-tertiary">Our arrangements</p>
          <h2 id="all-products-title" className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] leading-tight text-on-surface">
            Flowers, hampers &amp; plants
          </h2>
        </div>
        <Link to="/shop" className="inline-flex items-center gap-2 self-start border-b border-on-surface-variant pb-1 text-[15px] text-on-surface-variant transition-colors hover:border-tertiary hover:text-tertiary sm:self-auto">
          View all {products ? products.length : ''} products <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>

      {products ? (
        <div className="product-marquee overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_5%,#000_95%,transparent)] motion-reduce:overflow-x-auto">
          <div className="product-marquee-track flex w-max py-2" style={{ animationDuration: duration }}>
            {row(false)}
            {row(true)}
          </div>
        </div>
      ) : isError ? (
        <div className="mx-auto max-w-3xl px-4">
          <LoadError what="our flowers" onRetry={() => refetch()} retrying={isFetching} />
        </div>
      ) : (
        <div className="mx-auto flex max-w-7xl gap-6 overflow-hidden px-4 lg:px-12" aria-busy="true" aria-label="Loading products">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-[250px] shrink-0 animate-pulse">
              <div className="aspect-square rounded-2xl bg-surface-container" />
              <div className="mt-3 h-5 w-3/4 rounded bg-surface-container" />
              <div className="mt-2 h-4 w-1/3 rounded bg-surface-container" />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
