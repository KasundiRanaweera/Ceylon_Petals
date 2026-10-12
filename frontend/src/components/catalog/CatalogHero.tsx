import { NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Clock, Leaf } from 'lucide-react'
import PageHero, { type HeroImage } from '../ui/PageHero'
import type { Crumb } from '../ui/Breadcrumbs'
import { listCategories } from '../../services/catalog'
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
  const pill = ({ isActive }: { isActive: boolean }) =>
    `relative -mb-px whitespace-nowrap border-b-2 pb-3 pt-1 text-[12px] font-medium uppercase tracking-[0.16em] transition-colors ${
      isActive ? 'border-tertiary-container text-primary' : 'border-transparent text-secondary hover:text-primary'
    }`

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
      <nav aria-label="Categories" className="flex items-center gap-7 overflow-x-auto border-b border-outline-variant">
        <NavLink to="/shop" end className={pill}>All</NavLink>
        {categories.map((c) => (
          <NavLink key={c.id} to={`/products/${c.slug}`} className={pill}>
            {c.name}
          </NavLink>
        ))}
      </nav>
    </PageHero>
  )
}
