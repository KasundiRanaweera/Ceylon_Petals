import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import ProductGrid from '../shop/ProductGrid'
import { listProducts } from '../../services/catalog'

// The featured arrangements: the products the owner marks as Featured (Admin -> Products).
export default function SignatureSeries() {
  const { data: products } = useQuery({ queryKey: ['products', {}], queryFn: () => listProducts() })
  const featured = products?.filter((p) => p.isFeatured && p.stock > 0).slice(0, 6)

  return (
    <section aria-labelledby="signature-title" className="bg-surface-container-low py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-12">
        <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[13px] font-medium uppercase tracking-[0.22em] text-tertiary">Featured</p>
            <h2 id="signature-title" className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] leading-tight text-on-surface">
              Our featured arrangements
            </h2>
          </div>
          <Link to="/shop" className="self-start border-b border-on-surface-variant pb-1 text-[15px] text-on-surface-variant transition-colors hover:border-tertiary hover:text-tertiary sm:self-auto">
            View all flowers
          </Link>
        </div>
        <ProductGrid products={featured} loading={!products} columns={3} />
      </div>
    </section>
  )
}
