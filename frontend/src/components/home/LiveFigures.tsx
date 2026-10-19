import { useQuery } from '@tanstack/react-query'
import { useShop } from '../../hooks/useShop'
import { listProducts } from '../../services/catalog'
import { formatClock } from '../../lib/dates'

// The dark figures band. Every figure is real: it comes from the catalogue and the owner's settings.
export default function LiveFigures() {
  const shop = useShop()
  const { data: products } = useQuery({ queryKey: ['products', {}], queryFn: () => listProducts() })
  const figures = [
    { value: products ? `${products.length}+` : '—', label: 'Arrangements in the shop' },
    { value: String(shop.deliveryZones.filter((z) => z.active).length), label: 'Districts we deliver to' },
    { value: formatClock(shop.sameDayCutoff), label: 'Same-day order cut-off' },
    { value: 'Fresh', label: 'Cut every morning' },
  ]
  return (
    <section aria-label="The shop in figures" className="bg-primary py-16 lg:py-20">
      <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-y-10 px-4 text-center lg:grid-cols-4 lg:px-12">
        {figures.map((f) => (
          <div key={f.label} className="flex flex-col">
            <dt className="order-2 mt-3 text-[14px] tracking-[0.08em] text-white/70">{f.label}</dt>
            <dd className="order-1 font-display text-[clamp(2.25rem,5vw,3.75rem)] leading-none text-[#e9c349]">{f.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
