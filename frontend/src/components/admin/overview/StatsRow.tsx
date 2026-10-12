import { Link } from 'react-router-dom'
import { Banknote, ClipboardList, Package, TriangleAlert, ArrowUp, ArrowDown } from 'lucide-react'
import StatCard from '../StatCard'
import { formatLKR } from '../../../lib/format'
import { dashboardStats } from '../../../lib/orderStats'
import type { AdminOrder, DateRange } from '../../../types/admin'
import type { Product } from '../../../types'

const RANGE_LABEL: Record<DateRange, { title: string; compare: string }> = {
  today: { title: 'Sales Today', compare: 'vs yesterday' },
  week: { title: 'Sales This Week', compare: 'vs last week' },
  month: { title: 'Sales This Month', compare: 'vs last 30 days' },
}

export default function StatsRow({ range, orders, products }: { range: DateRange; orders: AdminOrder[]; products: Product[] }) {
  const stats = dashboardStats(orders, range)
  const label = RANGE_LABEL[range]
  const change = stats.salesChangePct
  const pct = (n: number) => `${stats.totalOrders ? (n / stats.totalOrders) * 100 : 0}%`
  const visible = products.filter((p) => p.isActive)
  const lowStock = visible.filter((p) => p.stock <= p.lowStockThreshold)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        title={label.title}
        icon={Banknote}
        footer={
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-secondary">
              <span>Online card: {stats.onlinePaymentPct}%</span>
              <span>Cash / WhatsApp: {stats.sales ? 100 - stats.onlinePaymentPct : 0}%</span>
            </div>
            <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${stats.onlinePaymentPct}%` }} />
            </div>
          </div>
        }
      >
        <div className="font-display text-headline-md text-primary">{formatLKR(stats.sales)}</div>
        {change === null ? (
          <div className="mt-1 text-label-md text-secondary">No sales in the previous period</div>
        ) : (
          <div className={`mt-1 inline-flex items-center gap-1 text-label-md ${change >= 0 ? 'text-emerald-700' : 'text-error'}`}>
            {change >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
            {/* Big jumps read better as a multiple ("19.5×") than as "1845%". */}
            <span>{change >= 200 ? `${(1 + change / 100).toFixed(1)}×` : `${Math.abs(change)}%`}</span>
            <span className="text-secondary font-normal">{label.compare}</span>
          </div>
        )}
      </StatCard>

      <StatCard
        title="Orders"
        icon={ClipboardList}
        footer={
          <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-surface-container">
            <div className="bg-tertiary-container" style={{ width: pct(stats.pendingOrders) }} />
            <div className="bg-primary-fixed-dim" style={{ width: pct(stats.inProgressOrders) }} />
            <div className="bg-primary" style={{ width: pct(stats.deliveredOrders) }} />
          </div>
        }
      >
        <div className="font-display text-headline-md text-primary">{stats.totalOrders} Orders</div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-secondary">
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-tertiary-container" />{stats.pendingOrders} Pending</span>
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary-fixed-dim" />{stats.inProgressOrders} In progress</span>
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" />{stats.deliveredOrders} Delivered</span>
        </div>
      </StatCard>

      <StatCard title="Products" icon={Package} footer={<Link to="/admin/products" className="text-label-md text-primary hover:underline">Manage products</Link>}>
        <div className="font-display text-headline-md text-primary">{products.length} Products</div>
        <div className="mt-1 text-[11px] text-secondary">
          {visible.length} in the shop • {products.length - visible.length} hidden • {visible.filter((p) => p.stock === 0).length} sold out
        </div>
      </StatCard>

      <StatCard
        title="Low Stock"
        icon={TriangleAlert}
        alert={lowStock.length > 0}
        footer={<Link to="/admin/inventory" className="text-label-md text-primary hover:underline">Review stock</Link>}
      >
        <div className={`font-display text-headline-md ${lowStock.length ? 'text-error' : 'text-primary'}`}>{lowStock.length} Items</div>
        <div className="mt-1 text-[11px] text-secondary truncate">
          {lowStock.length ? lowStock.map((p) => p.name).join(', ') : 'Everything is well stocked'}
        </div>
      </StatCard>
    </div>
  )
}
