import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Minus, Plus, Check } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import { useAdminProducts } from '../../hooks/useAdminData'
import { useToast } from '../../hooks/useToast'
import { updateStock } from '../../services/catalog'
import type { Product } from '../../types'

type View = 'attention' | 'all'

// Morning stock count: set today's numbers quickly. Sold-out items stay listed in the shop as "Sold out".
function StockRow({ product }: { product: Product }) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [value, setValue] = useState(String(product.stock))
  const save = useMutation({
    mutationFn: (stock: number) => updateStock(product.id, stock),
    onSuccess: (p) => {
      queryClient.invalidateQueries({ queryKey: ['admin'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product'] })
      setValue(String(p.stock))
      showToast(`${p.name}: ${p.stock} in stock`)
    },
  })
  const parsed = Math.max(0, Math.floor(Number(value) || 0))
  const changed = parsed !== product.stock
  const state = product.stock === 0 ? 'Sold out' : product.stock <= product.lowStockThreshold ? 'Low' : 'OK'

  return (
    <tr className="hover:bg-surface-container-low/50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <img src={product.images[0]} alt="" className="w-10 h-12 rounded-lg object-cover bg-surface-container shrink-0" />
          <div className="min-w-0">
            <Link to={`/admin/products/${product.id}`} className="block text-title-md text-primary hover:underline truncate max-w-[280px]">{product.name}</Link>
            {!product.isActive && <span className="text-[11px] text-secondary">Hidden from shop</span>}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
            state === 'Sold out' ? 'bg-error-container text-on-error-container' : state === 'Low' ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          {state}
        </span>
        <span className="block text-[11px] text-secondary mt-1">Warn below {product.lowStockThreshold}</span>
      </td>
      <td className="px-4 py-3">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (changed) save.mutate(parsed)
          }}
          className="flex items-center gap-2"
        >
          <button type="button" onClick={() => setValue(String(Math.max(0, parsed - 1)))} aria-label={`One less ${product.name}`} className="w-8 h-8 rounded-lg bg-surface-container-low text-primary flex items-center justify-center hover:bg-surface-container">
            <Minus size={14} />
          </button>
          <label htmlFor={`stock-${product.id}`} className="sr-only">Stock for {product.name}</label>
          <input
            id={`stock-${product.id}`}
            type="number"
            min={0}
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-20 bg-surface-container-low rounded-lg px-2 py-1.5 text-center text-title-md focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button type="button" onClick={() => setValue(String(parsed + 1))} aria-label={`One more ${product.name}`} className="w-8 h-8 rounded-lg bg-surface-container-low text-primary flex items-center justify-center hover:bg-surface-container">
            <Plus size={14} />
          </button>
          <button
            type="submit"
            disabled={!changed || save.isPending}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-label-md disabled:opacity-30"
          >
            <Check size={14} /> Save
          </button>
        </form>
      </td>
    </tr>
  )
}

export default function Inventory() {
  const { data: products = [], isLoading } = useAdminProducts()
  const [view, setView] = useState<View>('attention')
  const [query, setQuery] = useState('')

  const attention = products.filter((p) => p.stock <= p.lowStockThreshold)
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (view === 'attention' ? attention : products)
      .filter((p) => !q || p.name.toLowerCase().includes(q))
      .sort((a, b) => a.stock - b.stock)
  }, [view, attention, products, query])

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <AdminPageHeader eyebrow="Stock" title="Inventory" subtitle="Update today's stock. Orders take stock automatically; cancelled orders put it back." />

      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center bg-surface-container rounded-lg p-0.5" role="tablist" aria-label="Which products">
          {[
            { id: 'attention' as const, label: `Needs restocking (${attention.length})` },
            { id: 'all' as const, label: `All products (${products.length})` },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={view === t.id}
              onClick={() => setView(t.id)}
              className={`px-3 py-1 rounded text-label-md ${view === t.id ? 'bg-surface-container-lowest text-primary font-bold shadow-sm' : 'text-secondary'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative md:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a product..." aria-label="Find a product" className="w-full bg-surface-container-low rounded-lg py-2 pl-9 pr-3 text-body-sm focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
      </div>

      {isLoading ? (
        <div className="bg-surface-container-lowest rounded-xl h-64 animate-pulse" aria-busy="true" />
      ) : rows.length === 0 ? (
        <p className="bg-surface-container-lowest rounded-xl shadow-sm p-10 text-center text-body-md text-secondary">
          {view === 'attention' ? 'Everything is well stocked.' : 'No products match.'}
        </p>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-x-auto relative">
          <table className="w-full text-left min-w-[640px]">
            <thead>
              <tr className="bg-surface-container-low text-[11px] uppercase tracking-wider text-secondary">
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">In stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {rows.map((p) => (
                // Re-mount the row when stock changes elsewhere, so the input shows the new number.
                <StockRow key={`${p.id}-${p.stock}`} product={p} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
