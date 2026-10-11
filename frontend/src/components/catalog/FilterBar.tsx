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
    <div className="bg-surface-container-lowest rounded-xl p-3 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleMobileFilters}
          aria-expanded={mobileFiltersOpen}
          className="lg:hidden flex items-center gap-1.5 bg-surface-container px-3 py-2 rounded-lg text-primary text-label-md"
        >
          <SlidersHorizontal size={16} />
          Filters{active > 0 && ` (${active})`}
        </button>
        <span className="text-body-sm text-secondary" aria-live="polite">
          <strong className="text-primary">{totalCount}</strong> {totalCount === 1 ? 'item' : 'items'}
        </span>
        {active > 0 && (
          <button type="button" onClick={onClear} className="flex items-center gap-1 text-label-md text-primary hover:underline">
            <X size={14} /> Clear filters
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-lg">
        <ArrowUpDown size={16} className="text-secondary" />
        <label className="sr-only" htmlFor="sort">Sort by</label>
        <select
          id="sort"
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value as SortKey })}
          className="bg-transparent text-label-md text-primary focus:outline-none cursor-pointer"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
