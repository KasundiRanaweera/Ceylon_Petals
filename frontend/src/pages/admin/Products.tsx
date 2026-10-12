import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Star, Eye, EyeOff, Pencil, ExternalLink, PackageSearch, Trash2 } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { useAdminProducts } from '../../hooks/useAdminData'
import { useToast } from '../../hooks/useToast'
import { adminListCategories, deleteProduct, saveProduct, setProductActive } from '../../services/catalog'
import { formatLKR } from '../../lib/format'
import { discountPercent, effectivePrice } from '../../lib/pricing'
import type { Product } from '../../types'

type StatusFilter = 'all' | 'visible' | 'hidden' | 'featured' | 'sold-out' | 'low'

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'visible', label: 'In the shop' },
  { id: 'hidden', label: 'Hidden' },
  { id: 'featured', label: 'Featured' },
  { id: 'low', label: 'Low stock' },
  { id: 'sold-out', label: 'Sold out' },
]

function matchesStatus(p: Product, status: StatusFilter) {
  if (status === 'visible') return p.isActive
  if (status === 'hidden') return !p.isActive
  if (status === 'featured') return p.isFeatured
  if (status === 'sold-out') return p.stock === 0
  if (status === 'low') return p.stock > 0 && p.stock <= p.lowStockThreshold
  return true
}

export default function Products() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const { data: products, isLoading } = useAdminProducts()
  const { data: categories = [] } = useQuery({ queryKey: ['admin', 'categories'], queryFn: adminListCategories })
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [deleting, setDeleting] = useState<Product | null>(null)

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin'] })
    queryClient.invalidateQueries({ queryKey: ['products'] })
    queryClient.invalidateQueries({ queryKey: ['product'] })
  }

  const toggleActive = useMutation({
    mutationFn: (p: Product) => setProductActive(p.id, !p.isActive),
    onSuccess: (p) => {
      refresh()
      showToast(p.isActive ? `${p.name} is back in the shop` : `${p.name} is hidden from the shop`)
    },
  })
  const toggleFeatured = useMutation({
    mutationFn: (p: Product) => saveProduct({ ...p, isFeatured: !p.isFeatured }),
    onSuccess: (p) => {
      refresh()
      showToast(p.isFeatured ? `${p.name} will show on the home page` : `${p.name} removed from the home page`)
    },
  })

  const remove = useMutation({
    mutationFn: (p: Product) => deleteProduct(p.id).then(() => p),
    onSuccess: (p) => {
      refresh()
      showToast(`${p.name} was deleted`)
    },
    onError: (err: Error) => showToast(err.message, 'error'),
  })

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (products ?? []).filter(
      (p) =>
        (category === 'all' || p.categoryId === category) &&
        matchesStatus(p, status) &&
        (!q || p.name.toLowerCase().includes(q))
    )
  }, [products, query, category, status])

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <AdminPageHeader
        eyebrow="Catalogue"
        title="Products"
        subtitle="Add, edit or hide what customers can buy."
        actions={
          <Link to="/admin/products/new" className="inline-flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg text-label-md hover:bg-primary-container">
            <Plus size={18} /> Add product
          </Link>
        }
      />

      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
              className="w-full bg-surface-container-low rounded-lg py-2 pl-9 pr-3 text-body-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
            className="bg-surface-container-low text-label-md rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto relative pb-1">
          {STATUS_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setStatus(t.id)}
              className={`px-3 py-1 rounded-sm text-label-md whitespace-nowrap transition-colors ${
                status === t.id ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {t.label} ({(products ?? []).filter((p) => matchesStatus(p, t.id)).length})
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="bg-surface-container-lowest rounded-xl h-64 animate-pulse" aria-busy="true" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={PackageSearch} title="No products found" message="Try another search or filter." />
      ) : (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto relative">
            <table className="w-full text-left min-w-[860px]">
              <thead>
                <tr className="bg-surface-container-low text-[11px] uppercase tracking-wider text-secondary">
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                  <th className="px-4 py-3 font-semibold">Stock</th>
                  <th className="px-4 py-3 font-semibold">Featured</th>
                  <th className="px-4 py-3 font-semibold">In shop</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {filtered.map((p) => {
                  const off = discountPercent(p)
                  return (
                    <tr key={p.id} className={`hover:bg-surface-container-low/50 ${p.isActive ? '' : 'opacity-60'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={p.images[0]} alt="" className="w-12 h-14 rounded-lg object-cover bg-surface-container shrink-0" />
                          <div className="min-w-0">
                            <Link to={`/admin/products/${p.id}`} className="block text-title-md text-primary hover:underline truncate max-w-[260px]">{p.name}</Link>
                            {p.badge && <span className="text-[11px] text-secondary">{p.badge}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-body-sm">{categoryName(p.categoryId)}</td>
                      <td className="px-4 py-3">
                        <span className="text-currency-md text-primary whitespace-nowrap">{formatLKR(effectivePrice(p))}</span>
                        {off > 0 && <span className="block text-[11px] text-secondary whitespace-nowrap"><s>{formatLKR(p.price)}</s> · {off}% off</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-label-md ${p.stock === 0 ? 'text-error' : p.stock <= p.lowStockThreshold ? 'text-tertiary' : 'text-on-surface'}`}>
                          {p.stock === 0 ? 'Sold out' : p.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleFeatured.mutate(p)}
                          aria-pressed={p.isFeatured}
                          aria-label={p.isFeatured ? `Remove ${p.name} from featured` : `Feature ${p.name}`}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${p.isFeatured ? 'bg-tertiary-fixed text-tertiary' : 'bg-surface-container-low text-outline hover:text-tertiary'}`}
                        >
                          <Star size={16} fill={p.isFeatured ? 'currentColor' : 'none'} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleActive.mutate(p)}
                          className={`inline-flex items-center gap-1.5 text-label-md px-2.5 py-1 rounded-lg ${p.isActive ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-surface-container-high text-on-surface-variant'}`}
                        >
                          {p.isActive ? <Eye size={14} /> : <EyeOff size={14} />} {p.isActive ? 'Shown' : 'Hidden'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link to={`/admin/products/${p.id}`} aria-label={`Edit ${p.name}`} title="Edit" className="w-8 h-8 rounded-lg bg-surface-container-low text-primary hover:bg-primary hover:text-on-primary flex items-center justify-center">
                            <Pencil size={15} />
                          </Link>
                          {p.isActive && (
                            <a href={`/product/${p.slug}`} target="_blank" rel="noopener noreferrer" aria-label={`View ${p.name} in the shop`} title="View in shop" className="w-8 h-8 rounded-lg bg-surface-container-low text-primary hover:bg-primary hover:text-on-primary flex items-center justify-center">
                              <ExternalLink size={15} />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => setDeleting(p)}
                            aria-label={`Delete ${p.name}`}
                            title="Delete"
                            className="w-8 h-8 cursor-pointer rounded-lg bg-surface-container-low text-error hover:bg-error hover:text-on-error flex items-center justify-center"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete ${deleting?.name ?? ''}?`}
        message="This removes the product from the shop for good. Past orders keep their details. To take it off sale for a while, hide it instead."
        confirmLabel="Delete product"
        cancelLabel="Keep"
        tone="danger"
        onConfirm={() => {
          if (deleting) remove.mutate(deleting)
          setDeleting(null)
        }}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
