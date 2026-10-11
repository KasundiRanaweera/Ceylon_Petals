import { useQuery } from '@tanstack/react-query'
import ProductCard from '../shop/ProductCard'
import SectionHeading from '../ui/SectionHeading'
import { listProducts } from '../../services/catalog'

// Flower arrangements only (plants and hampers have their own pages).
const NOT_FLOWERS = ['indoor-plants', 'luxury-hampers']
const SECONDS_PER_CARD = 5

// An endless, gently moving row of flower cards. The list is drawn twice and the track slides
// left by exactly one copy, so the loop has no gap or jump. Hover (or keyboard focus) pauses
// it; with reduced motion it becomes a normal swipeable row.
export default function ProductCarousel() {
  const { data: products = [] } = useQuery({ queryKey: ['products', {}], queryFn: () => listProducts() })
  const flowers = products.filter((p) => !NOT_FLOWERS.includes(p.categoryId))

  if (flowers.length === 0) return <div className="h-[560px] bg-surface" aria-busy="true" />

  return (
    <section aria-label="Flower arrangements" className="w-full overflow-hidden bg-surface py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-12">
        <SectionHeading
          title="Fresh from today's flower room"
          highlight="flower room"
          action={{ label: 'Shop all flowers', to: '/shop' }}
          className="mb-10"
        />
      </div>

      <div className="carousel relative [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
        <ul
          className="animate-carousel flex w-max items-stretch py-3"
          style={{ ['--carousel-duration' as string]: `${flowers.length * SECONDS_PER_CARD}s` }}
        >
          {[0, 1].map((copy) =>
            flowers.map((p) => (
              <li
                key={`${copy}-${p.id}`}
                // Padding (not flex gap) keeps both copies exactly the same width, so -50% lands seamlessly.
                className="w-[260px] shrink-0 pr-5 sm:w-[300px] sm:pr-6 lg:w-[320px]"
                aria-hidden={copy === 1 || undefined}
              >
                <ProductCard product={p} copy={copy === 1} compact sizes="(min-width: 1024px) 600px, 560px" />
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  )
}
