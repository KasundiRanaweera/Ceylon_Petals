import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { SearchX } from 'lucide-react'
import CatalogHero from '../components/catalog/CatalogHero'
import FilterBar from '../components/catalog/FilterBar'
import FilterSidebar from '../components/catalog/FilterSidebar'
import Pagination from '../components/catalog/Pagination'
import FreshnessPromise from '../components/catalog/FreshnessPromise'
import ConsultationCTA from '../components/catalog/ConsultationCTA'
import ProductGrid from '../components/shop/ProductGrid'
import EmptyState from '../components/ui/EmptyState'
import NotFound from './NotFound'
import { listCategories, listProducts } from '../services/catalog'
import { OCCASIONS } from '../data/catalog'
import { EMPTY_FILTERS, activeFilterCount, applyFilters, type CatalogFilters } from '../components/catalog/catalogFilters'
import type { Category, Occasion } from '../types'

const PAGE_SIZE = 9

// Serves /shop (everything + search) and /products/:categorySlug (one category).
export default function CategoryListing() {
  const { categorySlug } = useParams<{ categorySlug: string }>()
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q')?.trim() ?? ''
  const occasion = OCCASIONS.find((o) => o.slug === searchParams.get('occasion'))
  const { data: categories, isLoading } = useQuery({ queryKey: ['categories'], queryFn: listCategories })

  if (categorySlug && isLoading) return <div className="min-h-[60vh]" aria-busy="true" />
  const category = categorySlug ? categories?.find((c) => c.slug === categorySlug) : undefined
  if (categorySlug && !category) return <NotFound />

  // A new category / search / occasion starts with fresh filters and page 1.
  return <CatalogView key={`${categorySlug}|${q}|${occasion?.slug}`} category={category} q={q} occasion={occasion} />
}

function CatalogView({ category, q, occasion }: { category?: Category; q: string; occasion?: Occasion }) {
  const [filters, setFilters] = useState<CatalogFilters>(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', { categoryId: category?.id, q, occasion: occasion?.slug }],
    queryFn: () => listProducts({ categoryId: category?.id, q: q || undefined, occasion: occasion?.slug }),
  })

  const filtered = useMemo(() => applyFilters(products ?? [], filters), [products, filters])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function updateFilters(changes: Partial<CatalogFilters>) {
    setFilters((prev) => ({ ...prev, ...changes }))
    setPage(1)
  }

  function changePage(next: number) {
    setPage(next)
    document.getElementById('catalog-results')?.scrollIntoView({ behavior: 'smooth' })
  }

  const title = q ? `Results for “${q}”` : occasion ? `${occasion.name} flowers & gifts` : category ? category.name : 'Shop all flowers & gifts'
  const subtitle = q
    ? 'Everything in our shop that matches your search.'
    : occasion?.description ?? category?.description ?? 'Every bouquet, hamper and plant we make, freshly prepared in Colombo each morning.'
  const breadcrumbs = category || q || occasion ? [{ label: 'Shop', to: '/shop' }, { label: category?.name ?? (q ? 'Search' : occasion!.name) }] : [{ label: 'Shop' }]

  const sidebar = (
    <FilterSidebar products={products ?? []} filters={filters} onChange={updateFilters} hideOccasions={Boolean(occasion)} />
  )

  return (
    <div className="flex flex-col w-full">
      <CatalogHero
        title={title}
        subtitle={subtitle}
        breadcrumbs={breadcrumbs}
        image={category && !q ? { src: category.imageUrl, alt: category.name, shape: 'landscape' } : undefined}
      />

      <section id="catalog-results" className="w-full px-4 lg:px-12 py-8 scroll-mt-32">
        <div className="max-w-7xl mx-auto">
          <FilterBar
            totalCount={filtered.length}
            filters={filters}
            onChange={updateFilters}
            onClear={() => updateFilters({ ...EMPTY_FILTERS, sort: filters.sort })}
            mobileFiltersOpen={mobileFiltersOpen}
            onToggleMobileFilters={() => setMobileFiltersOpen((v) => !v)}
          />

          {mobileFiltersOpen && <div className="lg:hidden mb-6">{sidebar}</div>}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="hidden lg:block lg:col-span-3">{sidebar}</div>
            <div className="lg:col-span-9">
              <ProductGrid
                products={isLoading ? undefined : pageItems}
                loading={isLoading}
                empty={
                  <EmptyState
                    icon={SearchX}
                    title={q && products?.length === 0 ? `Nothing found for “${q}”` : 'No items match these filters'}
                    message={
                      activeFilterCount(filters) > 0
                        ? 'Try removing a filter or two.'
                        : 'Try a different word, or browse all our flowers. We can also make something custom for you.'
                    }
                    action={
                      <>
                        {activeFilterCount(filters) > 0 && (
                          <button type="button" onClick={() => updateFilters(EMPTY_FILTERS)} className="px-4 py-2 rounded-lg bg-primary text-on-primary text-label-md">
                            Clear filters
                          </button>
                        )}
                        <Link to="/shop" className="px-4 py-2 rounded-lg bg-surface-container text-primary text-label-md">Browse everything</Link>
                        <Link to="/custom-order" className="px-4 py-2 rounded-lg bg-surface-container text-primary text-label-md">Request a custom order</Link>
                      </>
                    }
                  />
                }
              />
              {totalPages > 1 && (
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  shownRange={`${(page - 1) * PAGE_SIZE + 1} – ${Math.min(page * PAGE_SIZE, filtered.length)}`}
                  totalCount={filtered.length}
                  onPageChange={changePage}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      <FreshnessPromise />
      <ConsultationCTA />
    </div>
  )
}
