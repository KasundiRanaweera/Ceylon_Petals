import { useQuery } from '@tanstack/react-query'
import ProductGrid from '../shop/ProductGrid'
import { listProducts } from '../../services/catalog'
import SectionHeading from '../ui/SectionHeading'
import type { Product } from '../../types'

// The grid shows 2, 3 or 4 cards per row depending on the screen, so a multiple of 12 fills
// every row at every width.
const ROW_MULTIPLE = 12

// Every product the owner marks as "Featured" in Admin → Products appears here (none are cut off).
// If the last row isn't full, it's topped up with other in-stock bouquets so the grid never has a gap.
function fillRows(all: Product[]): Product[] {
  const featured = all.filter((p) => p.isFeatured)
  const missing = (ROW_MULTIPLE - (featured.length % ROW_MULTIPLE)) % ROW_MULTIPLE
  if (missing === 0) return featured
  const extras = all
    .filter((p) => !p.isFeatured && p.stock > 0 && p.categoryId !== 'indoor-plants')
    .slice(0, missing)
  return [...featured, ...extras]
}

export default function FeaturedProducts() {
  const { data: products } = useQuery({ queryKey: ['products', {}], queryFn: () => listProducts() })

  return (
    <section id="featured-collection" className="w-full bg-dawn-soft py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-12">
        <SectionHeading
          title="Most-loved arrangements"
          highlight="arrangements"
          description="The bouquets and hampers our customers order again and again."
          action={{ label: 'View all flowers', to: '/shop' }}
          className="mb-12"
        />
        <ProductGrid products={products && fillRows(products)} loading={!products} columns={4} />
      </div>
    </section>
  )
}
