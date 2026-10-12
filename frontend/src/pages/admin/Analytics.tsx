import { useState } from 'react'
import { Banknote, ClipboardList, Receipt, XCircle } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import StatCard from '../../components/admin/StatCard'
import { useAdminOrders } from '../../hooks/useAdminData'
import { formatLKR } from '../../lib/format'
import { isSale, ordersByDay, ordersInRange, salesByDistrict, salesByPaymentMethod, topProducts } from '../../lib/orderStats'
import { PAYMENT_METHOD_LABEL } from '../../lib/orderStatus'
import type { DateRange, PaymentMethod } from '../../types/admin'

const RANGES: { id: DateRange; label: string; days: number }[] = [
  { id: 'today', label: 'Today', days: 1 },
  { id: 'week', label: 'Last 7 days', days: 7 },
  { id: 'month', label: 'Last 30 days', days: 30 },
]

export default function Analytics() {
  const [range, setRange] = useState<DateRange>('month')
  const { data: all = [], isLoading } = useAdminOrders()
  const days = RANGES.find((r) => r.id === range)!.days
  const orders = ordersInRange(all, range)
  const sales = orders.filter(isSale)
  const revenue = sales.reduce((s, o) => s + o.total, 0)
  const cancelled = orders.length - sales.length
  const daily = ordersByDay(all, Math.max(days, 7))
  const maxSales = Math.max(1, ...daily.map((d) => d.sales ?? 0))
  const byMethod = salesByPaymentMethod(orders)
  const top = topProducts(orders)
  const districts = salesByDistrict(orders).slice(0, 6)

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <AdminPageHeader
        eyebrow="Reports"
        title="Analytics"
        subtitle="Sales and orders, counted by the day each order was placed. Cancelled and failed orders are not counted as sales."
        actions={
          <div className="flex items-center bg-surface-container rounded-lg p-0.5" role="tablist" aria-label="Date range">
            {RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                role="tab"
                aria-selected={range === r.id}
                onClick={() => setRange(r.id)}
                className={`whitespace-nowrap px-3 py-1 rounded text-label-md ${range === r.id ? 'bg-surface-container-lowest text-primary font-bold shadow-sm' : 'text-secondary hover:text-on-surface'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      {isLoading ? (
        <div className="bg-surface-container-lowest rounded-xl h-64 animate-pulse" aria-busy="true" />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard title="Sales" icon={Banknote}><div className="font-display text-headline-md text-primary">{formatLKR(revenue)}</div></StatCard>
            <StatCard title="Orders" icon={ClipboardList}><div className="font-display text-headline-md text-primary">{sales.length}</div></StatCard>
            <StatCard title="Average order" icon={Receipt}>
              <div className="font-display text-headline-md text-primary">{formatLKR(sales.length ? Math.round(revenue / sales.length) : 0)}</div>
            </StatCard>
            <StatCard title="Cancelled / failed" icon={XCircle} alert={cancelled > 0}>
              <div className="font-display text-headline-md text-primary">{cancelled}</div>
            </StatCard>
          </div>

          <section className="bg-surface-container-lowest rounded-xl shadow-sm p-5 space-y-4">
            <h2 className="font-display text-headline-sm text-primary">Daily sales{days < 7 ? ' (last 7 days)' : ''}</h2>
            <div className="h-48 flex items-end gap-1" role="img" aria-label="Bar chart of sales per day">
              {daily.map((d, i) => (
                <div key={`${d.day}-${i}`} className="flex-1 h-full flex items-end group relative">
                  <div className="w-full rounded-t bg-primary-fixed-dim group-hover:bg-primary transition-colors" style={{ height: `${Math.max(1, ((d.sales ?? 0) / maxSales) * 100)}%` }} />
                  <span className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap bg-inverse-surface text-inverse-on-surface text-[11px] px-2 py-1 rounded z-10">
                    {d.day}: {formatLKR(d.sales ?? 0)} · {d.orders} orders
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[11px] text-secondary">
              <span>{daily[0]?.day}</span>
              <span>{daily[daily.length - 1]?.day}</span>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <section className="bg-surface-container-lowest rounded-xl shadow-sm p-5 space-y-3 lg:col-span-2">
              <h2 className="font-display text-headline-sm text-primary">Best sellers</h2>
              {top.length === 0 ? (
                <p className="text-body-sm text-secondary">No sales in this period.</p>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wider text-secondary">
                      <th className="py-2 font-semibold">Product</th>
                      <th className="py-2 font-semibold text-right">Sold</th>
                      <th className="py-2 font-semibold text-right">Sales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {top.map((p) => (
                      <tr key={p.name}>
                        <td className="py-2 text-body-md">{p.name}</td>
                        <td className="py-2 text-right text-body-md">{p.quantity}</td>
                        <td className="py-2 text-right text-currency-md text-primary">{formatLKR(p.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <div className="space-y-6">
              <section className="bg-surface-container-lowest rounded-xl shadow-sm p-5 space-y-3">
                <h2 className="font-display text-headline-sm text-primary">How customers pay</h2>
                {(Object.keys(byMethod) as PaymentMethod[]).map((m) => {
                  const pct = revenue ? Math.round((byMethod[m] / revenue) * 100) : 0
                  return (
                    <div key={m}>
                      <div className="flex justify-between text-body-sm mb-1">
                        <span>{PAYMENT_METHOD_LABEL[m]}</span>
                        <span className="text-secondary">{pct}% · {formatLKR(byMethod[m])}</span>
                      </div>
                      <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </section>

              <section className="bg-surface-container-lowest rounded-xl shadow-sm p-5 space-y-3">
                <h2 className="font-display text-headline-sm text-primary">Top delivery areas</h2>
                {districts.length === 0 ? (
                  <p className="text-body-sm text-secondary">No deliveries in this period.</p>
                ) : (
                  <ul className="space-y-2">
                    {districts.map((d) => (
                      <li key={d.district} className="flex justify-between text-body-sm">
                        <span>{d.district}</span>
                        <span className="text-secondary">{d.orders} orders · {formatLKR(d.sales ?? 0)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
