import { Link } from 'react-router-dom'
import type { Product } from '../../../types'

export default function LowStockWatch({ products }: { products: Product[] }) {
  const low = products
    .filter((p) => p.isActive && p.stock <= p.lowStockThreshold)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5)

  return (
    <div className="space-y-4 rounded-xl bg-surface-container-lowest p-5 shadow-sm ring-1 ring-outline-variant/30">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-headline-sm text-primary">Low Stock Watch</h3>
        <span className="text-[11px] text-secondary">{low.length} items</span>
      </div>

      {low.length === 0 ? (
        <p className="text-body-sm text-secondary">Nothing is running low.</p>
      ) : (
        <div className="space-y-4">
          {low.map((item) => {
            const pct = Math.min(100, (item.stock / Math.max(1, item.lowStockThreshold)) * 100)
            const critical = pct <= 30
            return (
              <div key={item.id}>
                <div className="flex justify-between text-body-sm mb-1 gap-2">
                  <Link to={`/admin/products/${item.id}`} className="text-on-surface hover:text-primary truncate">{item.name}</Link>
                  <span className={`shrink-0 ${critical ? 'text-error font-semibold' : 'text-secondary'}`}>
                    {item.stock === 0 ? 'Sold out' : `${item.stock} left`}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${critical ? 'bg-error' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Link to="/admin/inventory" className="inline-block text-label-md text-primary hover:underline">Manage stock</Link>
    </div>
  )
}
