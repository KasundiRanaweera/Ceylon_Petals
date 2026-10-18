import { useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Clock, Leaf } from 'lucide-react'
import PageHero, { type HeroImage } from '../ui/PageHero'
import type { Crumb } from '../ui/Breadcrumbs'
import { listCategories, listProducts } from '../../services/catalog'
import PillTabs from '../ui/PillTabs'
import { useShop } from '../../hooks/useShop'
import { useCutoffCountdown } from '../../hooks/useCutoffCountdown'
import { formatClock } from '../../lib/dates'

interface CatalogHeroProps {
  title: string
  subtitle: string
  breadcrumbs: Crumb[]
  eyebrow?: string
  image?: HeroImage
}

function CutoffCard() {
  const { sameDayCutoff } = useShop()
  const minutesLeft = useCutoffCountdown(sameDayCutoff)
  return (
    <div className="flex w-full items-center gap-3 rounded-2xl bg-surface-container-lowest/90 p-4 shadow-sm backdrop-blur-md sm:w-auto">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-primary">
        <Clock size={22} />
      </span>
      {minutesLeft !== null ? (
        <div>
          <p className="text-title-md text-primary">Order within {Math.floor(minutesLeft / 60)}h {minutesLeft % 60}m</p>
          <p className="text-body-sm text-secondary">for same-day delivery (cut-off {formatClock(sameDayCutoff)})</p>
        </div>
      ) : (
        <div>
          <p className="text-title-md text-primary">Same-day orders closed for today</p>
          <p className="text-body-sm text-secondary">Order now for delivery tomorrow</p>
        </div>
      )}
    </div>
  )
}

export default function CatalogHero({ title, subtitle, breadcrumbs, eyebrow = 'Fresh every morning', image }: CatalogHeroProps) {
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: listCategories })
  // Same query as the shop grid, so the counts cost no extra request.
  const { data: products } = useQuery({ queryKey: ['products', {}], queryFn: () => listProducts() })
  const { pathname } = useLocation()
  const active = pathname.startsWith('/products/') ? pathname.split('/')[2] : 'all'
  const count = (slug?: string) => (products ? products.filter((p) => !slug || p.categoryId === slug).length : null)
  const options = [
    { id: 'all', label: 'All', to: '/shop', count: count() },
    ...categories.map((c) => ({ id: c.slug, label: c.name, to: `/products/${c.slug}`, count: count(c.slug) })),
  ]

  return (
    <PageHero
      breadcrumbs={breadcrumbs}
      eyebrow={eyebrow}
      eyebrowIcon={Leaf}
      title={title}
      subtitle={subtitle}
      image={image}
      aside={<CutoffCard />}
      actions={image ? <CutoffCard /> : undefined}
      size="compact"
    >
      <PillTabs label="Categories" active={active} options={options} />
    </PageHero>
  )
}
