import { useMemo } from 'react'
import type { OccasionSlug, Product } from '../../types'
import { OCCASION_NAME } from '../../data/catalog'
import { PRICE_BANDS, facet, type CatalogFilters } from './catalogFilters'

interface FilterSidebarProps {
  /** All products in the current category/search, before filtering — used for counts. */
  products: Product[]
  filters: CatalogFilters
  onChange: (changes: Partial<CatalogFilters>) => void
  /** Hide the occasion group (e.g. when the page is already one occasion). */
  hideOccasions?: boolean
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

function CheckGroup({
  title, options, selected, onToggle, labelFor = (v) => v,
}: {
  title: string
  options: { value: string; count: number }[]
  selected: string[]
  onToggle: (value: string) => void
  labelFor?: (value: string) => string
}) {
  if (options.length === 0) return null
  return (
    <fieldset className="rounded-xl bg-surface-container-lowest ring-1 ring-outline-variant/40 shadow-[0_18px_40px_-28px_rgba(48,48,48,0.35)] p-5 space-y-2">
      <legend className="sr-only">{title}</legend>
      <h3 className="font-display text-title-md text-on-surface" aria-hidden="true">{title}</h3>
      <div className="space-y-1 text-body-sm text-on-surface">
        {options.map((o) => (
          <label key={o.value} className="flex items-center justify-between cursor-pointer py-1 hover:text-tertiary">
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selected.includes(o.value)}
                onChange={() => onToggle(o.value)}
                className="accent-[#d4af37] w-4 h-4"
              />
              {labelFor(o.value)}
            </span>
            <span className="text-[11px] text-on-surface-variant">{o.count}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export default function FilterSidebar({ products, filters, onChange, hideOccasions = false }: FilterSidebarProps) {
  const occasions = useMemo(() => facet(products, (p) => p.occasions), [products])
  const flowers = useMemo(() => facet(products, (p) => p.flowerTypes), [products])
  const colours = useMemo(() => facet(products, (p) => p.colours), [products])

  return (
    <aside className="space-y-4" aria-label="Filters">
      <fieldset className="rounded-xl bg-surface-container-lowest ring-1 ring-outline-variant/40 shadow-[0_18px_40px_-28px_rgba(48,48,48,0.35)] p-5 space-y-2">
        <legend className="sr-only">Price</legend>
        <h3 className="font-display text-title-md text-on-surface" aria-hidden="true">Price</h3>
        <div className="space-y-1 text-body-sm">
          {PRICE_BANDS.map((band) => (
            <label key={band.id} className="flex items-center gap-2 cursor-pointer py-1 hover:text-tertiary">
              <input
                type="radio"
                name="price-band"
                checked={filters.price === band.id}
                onChange={() => onChange({ price: band.id })}
                className="accent-[#d4af37] w-4 h-4"
              />
              {band.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="rounded-xl bg-surface-container-lowest ring-1 ring-outline-variant/40 shadow-[0_18px_40px_-28px_rgba(48,48,48,0.35)] p-5 space-y-2">
        <legend className="sr-only">Availability</legend>
        <h3 className="font-display text-title-md text-on-surface" aria-hidden="true">Availability</h3>
        <label className="flex items-center gap-2 cursor-pointer py-1 text-body-sm hover:text-tertiary">
          <input type="checkbox" checked={filters.sameDayOnly} onChange={(e) => onChange({ sameDayOnly: e.target.checked })} className="accent-[#d4af37] w-4 h-4" />
          Same-day delivery
        </label>
        <label className="flex items-center gap-2 cursor-pointer py-1 text-body-sm hover:text-tertiary">
          <input type="checkbox" checked={filters.inStockOnly} onChange={(e) => onChange({ inStockOnly: e.target.checked })} className="accent-[#d4af37] w-4 h-4" />
          In stock only
        </label>
      </fieldset>

      {!hideOccasions && (
        <CheckGroup
          title="Occasion"
          options={occasions}
          selected={filters.occasions}
          onToggle={(v) => onChange({ occasions: toggle(filters.occasions, v as OccasionSlug) })}
          labelFor={(v) => OCCASION_NAME[v as OccasionSlug] ?? v}
        />
      )}
      <CheckGroup title="Flower" options={flowers} selected={filters.flowerTypes} onToggle={(v) => onChange({ flowerTypes: toggle(filters.flowerTypes, v) })} />
      <CheckGroup title="Colour" options={colours} selected={filters.colours} onToggle={(v) => onChange({ colours: toggle(filters.colours, v) })} />
    </aside>
  )
}
