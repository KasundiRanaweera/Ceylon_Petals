import { Bird, Briefcase, Cake, Flower2, Gem, Heart, HeartPulse, PartyPopper, Sparkles, type LucideIcon } from 'lucide-react'
import PillTabs from '../ui/PillTabs'
import { OCCASIONS } from '../../data/occasions'
import type { OccasionSlug, Product } from '../../types'

const ICONS: Record<OccasionSlug | 'all', LucideIcon> = {
  all: Sparkles,
  anniversary: Gem,
  birthday: Cake,
  love: Heart,
  wedding: Flower2,
  sympathy: Bird,
  'get-well': HeartPulse,
  congratulations: PartyPopper,
  corporate: Briefcase,
}

interface OccasionTabsProps {
  active: string
  onChange: (slug: string) => void
  products?: Product[]
}

// Occasion picker: the same category chips as every other shop page, each with its icon and how
// many designs it has.
export default function OccasionTabs({ active, onChange, products }: OccasionTabsProps) {
  const count = (slug: string) =>
    products ? (slug === 'all' ? products.filter((p) => p.occasions.length > 0).length : products.filter((p) => p.occasions.includes(slug as OccasionSlug)).length) : null
  const options = [{ id: 'all', label: 'All occasions' }, ...OCCASIONS.map((o) => ({ id: o.slug, label: o.name }))].map((o) => ({
    ...o,
    icon: ICONS[o.id as OccasionSlug | 'all'],
    count: count(o.id),
  }))

  return (
    <section className="border-b border-outline-variant bg-surface py-6">
      <div className="mx-auto max-w-7xl px-4 lg:px-12">
        <p className="mb-3 text-[13px] font-medium uppercase tracking-[0.22em] text-tertiary">Choose an occasion</p>
        <PillTabs label="Occasions" active={active} onChange={onChange} options={options} />
      </div>
    </section>
  )
}
