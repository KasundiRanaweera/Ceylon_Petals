import { SlidersHorizontal, ArrowUpDown, X } from 'lucide-react'
import { SORT_OPTIONS, activeFilterCount, type CatalogFilters, type SortKey } from './catalogFilters'

interface FilterBarProps {
  totalCount: number
  filters: CatalogFilters
  onChange: (changes: Partial<CatalogFilters>) => void
  onClear: () => void
  mobileFiltersOpen: boolean
  onToggleMobileFilters: () => void
}

export default function FilterBar({ totalCount, filters, onChange, onClear, mobileFiltersOpen, onToggleMobileFilters }: FilterBarProps) {
  const active = activeFilterCount(filters)

  return (
    <div className="rounded-xl bg-surface-container-lowest ring-1 ring-outline-variant/40 shadow-[0_18px_40px_-28px_rgba(48,48,48,0.35)] p-3 mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleMobileFilters}
          aria-expanded={mobileFiltersOpen}
          className="lg:hidden flex items-center gap-1.5 rounded-lg border border-[#d4af37] px-3 py-2 text-tertiary text-label-md transition-colors hover:bg-[#d4af37] hover:text-on-tertiary-container"
        >
          <SlidersHorizontal size={16} />
          Filters{active > 0 && ` (${active})`}
        </button>
        <span className="text-body-sm text-on-surface-variant" aria-live="polite">
          <strong className="font-display text-tertiary">{totalCount}</strong> {totalCount === 1 ? 'item' : 'items'}
        </span>
        {active > 0 && (
          <button type="button" onClick={onClear} className="flex items-center gap-1 text-label-md text-on-surface-variant underline underline-offset-4 hover:text-tertiary">
            <X size={14} /> Clear filters
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 bg-surface-container-low ring-1 ring-outline-variant/40 px-3 py-1.5 rounded-lg focus-within:ring-[#d4af37]">
        <ArrowUpDown size={16} className="text-tertiary" />
        <label className="sr-only" htmlFor="sort">Sort by</label>
        <select
          id="sort"
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value as SortKey })}
          className="bg-transparent text-label-md text-on-surface focus:outline-none cursor-pointer"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
