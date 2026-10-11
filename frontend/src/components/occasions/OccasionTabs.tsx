import { motion } from 'motion/react'
import { Bird, Briefcase, Cake, Flower2, Gem, Heart, HeartPulse, PartyPopper, Sparkles, type LucideIcon } from 'lucide-react'
import { OCCASIONS } from '../../data/catalog'
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

// Occasion picker: a row of icon tiles with how many arrangements each has. The dark highlight
// glides between tiles (shared layoutId). Swipeable on phones, one tidy row on desktop.
export default function OccasionTabs({ active, onChange, products }: OccasionTabsProps) {
  const count = (slug: string) => (products ? (slug === 'all' ? products.filter((p) => p.occasions.length > 0).length : products.filter((p) => p.occasions.includes(slug as OccasionSlug)).length) : null)
  const options = [{ id: 'all', label: 'All occasions' }, ...OCCASIONS.map((o) => ({ id: o.slug, label: o.name }))]

  return (
    <section className="border-b border-outline-variant bg-surface py-6">
      <div className="mx-auto max-w-7xl px-4 lg:px-12">
        <p id="occasion-picker-label" className="eyebrow mb-3 text-secondary">
          Choose an occasion
        </p>
        <div
          role="tablist"
          aria-labelledby="occasion-picker-label"
          className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-9 lg:overflow-visible lg:px-0 lg:pb-0"
        >
          {options.map((o) => {
            const Icon = ICONS[o.id as OccasionSlug | 'all']
            const selected = active === o.id
            const n = count(o.id)
            return (
              <button
                key={o.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onChange(o.id)}
                className={`group relative flex w-[7.5rem] shrink-0 cursor-pointer snap-start flex-col items-center gap-2 rounded-md border px-2 py-4 text-center transition-colors lg:w-auto ${
                  selected ? 'border-transparent text-white' : 'border-outline-variant bg-surface-container-lowest text-primary hover:border-[#c8930a]/60 hover:bg-surface-container-low'
                }`}
              >
                {selected && (
                  <motion.span
                    layoutId="occasion-picker-active"
                    className="absolute inset-0 rounded-md bg-primary shadow-[0_16px_30px_-16px_rgba(12,10,9,0.6)]"
                    transition={{ type: 'spring', bounce: 0.2, visualDuration: 0.35 }}
                  />
                )}
                <span
                  className={`relative flex h-11 w-11 items-center justify-center rounded-full transition-transform group-hover:-translate-y-0.5 ${
                    selected ? 'bg-white/10 text-[#e7c873]' : 'bg-tertiary-fixed/60 text-tertiary'
                  }`}
                >
                  <Icon size={20} />
                </span>
                <span className="relative text-[13.5px] font-medium leading-tight">{o.label}</span>
                {n !== null && (
                  <span className={`relative text-[12px] ${selected ? 'text-white/70' : 'text-secondary'}`}>
                    {n} {n === 1 ? 'design' : 'designs'}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
