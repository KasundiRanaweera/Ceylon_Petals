import { useQuery } from '@tanstack/react-query'
import { useShop } from '../../hooks/useShop'
import { useReviews } from '../../hooks/useReviews'
import { listProducts, listCategories } from '../../services/catalog'
import { formatClock } from '../../lib/dates'
import { formatLKR } from '../../lib/format'
import { sameDayDistricts } from '../../lib/shopInfo'

// The dark figures band: one slim row of the shop's figures that slides from right to left on a
// loop. Every figure is real, from the catalogue, the owner's settings and the published reviews;
// a figure with no data yet is left out. The row is drawn twice side by side and moves by one
// copy's width, so it never jumps. It pauses on hover and stays still with reduced motion.
export default function LiveFigures() {
  const shop = useShop()
  const { data: products } = useQuery({ queryKey: ['products', {}], queryFn: () => listProducts() })
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: listCategories })
  const { data: reviews } = useReviews()
  const activeZones = shop.deliveryZones.filter((z) => z.active).length
  const sameDay = sameDayDistricts(shop).length

  const figures = [
    products && { value: String(products.length), label: 'Arrangements in the shop' },
    categories && { value: String(categories.length), label: 'Collections to explore' },
    activeZones > 0 && { value: String(activeZones), label: 'Districts we deliver to' },
    sameDay > 0 && { value: String(sameDay), label: 'Districts with same-day delivery' },
    { value: formatClock(shop.sameDayCutoff), label: 'Same-day order cut-off' },
    shop.freeDeliveryOver > 0 && { value: formatLKR(shop.freeDeliveryOver), label: 'Free delivery over' },
    reviews && reviews.count > 0 && { value: `${reviews.average.toFixed(1)}★`, label: `From ${reviews.count} customer reviews` },
    { value: 'Fresh', label: 'Cut every morning' },
  ].filter((f): f is { value: string; label: string } => Boolean(f))

  const row = (copy: boolean) => (
    <ul aria-hidden={copy || undefined} className="flex shrink-0 items-center">
      {figures.map((f) => (
        <li key={f.label} className="flex shrink-0 items-center gap-4 px-8 sm:px-10">
          <span className="font-display text-[clamp(1.75rem,3vw,2.5rem)] leading-none text-[#e9c349] tabular-nums">{f.value}</span>
          <span className="max-w-[9rem] text-[11.5px] uppercase leading-snug tracking-[0.18em] text-white/65">{f.label}</span>
          <span aria-hidden="true" className="ml-8 text-[#e9c349]/60 sm:ml-10">✦</span>
        </li>
      ))}
    </ul>
  )

  return (
    <section aria-label="The shop in figures" className="figures-marquee relative overflow-hidden bg-primary py-6 lg:py-8">
      {/* soft charcoal fades at both ends, so figures slide in and out instead of being cut off */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-primary to-transparent sm:w-28" />
      <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-primary to-transparent sm:w-28" />
      <div key={figures.length} className="figures-marquee-track flex w-max">
        {row(false)}
        {row(true)}
      </div>
    </section>
  )
}
