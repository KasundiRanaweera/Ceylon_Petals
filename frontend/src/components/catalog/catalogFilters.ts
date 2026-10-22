import type { OccasionSlug, Product } from '../../types'
import { effectivePrice } from '../../lib/pricing'

export type PriceBand = 'all' | 'under-15k' | '15k-25k' | 'over-25k'
export type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'newest'

export interface CatalogFilters {
  occasions: OccasionSlug[]
  flowerTypes: string[]
  colours: string[]
  price: PriceBand
  inStockOnly: boolean
  sameDayOnly: boolean
  sort: SortKey
}

export const EMPTY_FILTERS: CatalogFilters = {
  occasions: [],
  flowerTypes: [],
  colours: [],
  price: 'all',
  inStockOnly: false,
  sameDayOnly: false,
  sort: 'featured',
}

export const PRICE_BANDS: { id: PriceBand; label: string }[] = [
  { id: 'all', label: 'Any price' },
  { id: 'under-15k', label: 'Under Rs. 15,000' },
  { id: '15k-25k', label: 'Rs. 15,000 – 25,000' },
  { id: 'over-25k', label: 'Over Rs. 25,000' },
]

export const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'newest', label: 'Newest' },
]

function inBand(price: number, band: PriceBand) {
  if (band === 'under-15k') return price < 15000
  if (band === '15k-25k') return price >= 15000 && price <= 25000
  if (band === 'over-25k') return price > 25000
  return true
}

const anyOf = (selected: string[], values: string[]) => selected.length === 0 || selected.some((s) => values.includes(s))

export function applyFilters(products: Product[], f: CatalogFilters): Product[] {
  const result = products.filter(
    (p) =>
      anyOf(f.occasions, p.occasions) &&
      anyOf(f.flowerTypes, p.flowerTypes) &&
      anyOf(f.colours, p.colours) &&
      inBand(effectivePrice(p), f.price) &&
      (!f.inStockOnly || p.stock > 0) &&
      (!f.sameDayOnly || p.sameDay)
  )
  return sortProducts(result, f.sort)
}

function sortProducts(products: Product[], sort: SortKey): Product[] {
  const list = [...products]
  if (sort === 'price-asc') list.sort((a, b) => effectivePrice(a) - effectivePrice(b))
  else if (sort === 'price-desc') list.sort((a, b) => effectivePrice(b) - effectivePrice(a))
  else if (sort === 'newest') list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  // Featured first, then in-stock before sold out.
  else list.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || Number(b.stock > 0) - Number(a.stock > 0))
  return list
}

/** Distinct values with how many products have each, for the filter checkboxes. */
export function facet(products: Product[], pick: (p: Product) => string[]): { value: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const p of products) for (const v of pick(p)) counts.set(v, (counts.get(v) ?? 0) + 1)
  return [...counts.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count)
}

export function activeFilterCount(f: CatalogFilters): number {
  return f.occasions.length + f.flowerTypes.length + f.colours.length + (f.price !== 'all' ? 1 : 0) + (f.inStockOnly ? 1 : 0) + (f.sameDayOnly ? 1 : 0)
}
