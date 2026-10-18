import { useState } from 'react'
import { Banknote, ClipboardList, HandCoins, Receipt, RotateCcw, Wallet, XCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { adminListCategories } from '../../services/catalog'
import { formatPhone } from '../../lib/phone'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import StatCard from '../../components/admin/StatCard'
import { useAdminOrders, useAdminProducts } from '../../hooks/useAdminData'
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

  // ---- Money: what is already in, what is still to collect, what went back.
  const collected = sales.filter((o) => o.paymentStatus === 'PAID').reduce((sum, o) => sum + o.total, 0)
  const toCollect = sales.filter((o) => o.paymentStatus === 'PENDING' && o.paymentMethod !== 'CARD')
  const toCollectTotal = toCollect.reduce((sum, o) => sum + o.total, 0)
  const refunded = orders.filter((o) => o.paymentStatus === 'REFUNDED').reduce((sum, o) => sum + o.total, 0)

  // ---- Sales by category (custom-built hampers have no product, so they get their own line).
  const { data: products = [] } = useAdminProducts()
  const { data: categories = [] } = useQuery({ queryKey: ['admin', 'categories'], queryFn: adminListCategories })
  const categoryOf = new Map(products.map((p) => [p.id, p.categoryId]))
  const categoryName = new Map(categories.map((c) => [c.id, c.name]))
  const byCategory = new Map<string, number>()
  for (const o of sales) {
    for (const item of o.items ?? []) {
      const cat = item.productId ? categoryName.get(categoryOf.get(item.productId) ?? '') ?? 'Other' : 'Custom hampers'
      byCategory.set(cat, (byCategory.get(cat) ?? 0) + item.unitPrice * item.quantity)
    }
  }
  const categoryRows = [...byCategory.entries()].sort((a, b) => b[1] - a[1])
  const categoryMax = Math.max(1, ...categoryRows.map(([, v]) => v))

  // ---- Best customers in this period (guests and account holders, matched by phone).
  const spend = new Map<string, { name: string; phone: string; orders: number; total: number }>()
  for (const o of sales) {
    const row = spend.get(o.customerPhone) ?? { name: o.customerName, phone: o.customerPhone, orders: 0, total: 0 }
    row.orders += 1
    row.total += o.total
    spend.set(o.customerPhone, row)
  }
  const topCustomers = [...spend.values()].sort((a, b) => b.total - a.total).slice(0, 5)

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

          {/* Money in, money still to collect, money given back */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard title="Paid so far" icon={Wallet}>
              <div className="text-headline-md font-semibold text-emerald-800">{formatLKR(collected)}</div>
              <p className="text-body-sm text-secondary">Card payments and cash or transfers you have marked paid.</p>
            </StatCard>
            <StatCard title="Still to collect" icon={HandCoins} alert={toCollectTotal > 0}>
              <div className="text-headline-md font-semibold text-primary">{formatLKR(toCollectTotal)}</div>
              <p className="text-body-sm text-secondary">
                {toCollect.length === 0 ? 'Nothing outstanding.' : `${toCollect.length} cash on delivery or WhatsApp ${toCollect.length === 1 ? 'order' : 'orders'} not marked paid yet.`}
              </p>
            </StatCard>
            <StatCard title="Refunded" icon={RotateCcw}>
              <div className="text-headline-md font-semibold text-primary">{formatLKR(refunded)}</div>
              <p className="text-body-sm text-secondary">Money returned to customers in this period.</p>
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

            <section className="bg-surface-container-lowest rounded-xl shadow-sm p-5 space-y-3 lg:col-span-2">
              <h2 className="font-display text-headline-sm text-primary">Sales by category</h2>
              {categoryRows.length === 0 ? (
                <p className="text-body-sm text-secondary">No sales in this period.</p>
              ) : (
                <ul className="space-y-3">
                  {categoryRows.map(([name, value]) => (
                    <li key={name}>
                      <div className="mb-1 flex justify-between text-body-sm">
                        <span>{name}</span>
                        <span className="text-secondary">{formatLKR(value)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-surface-container">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#e8a3b5] via-[#f2c7a5] to-[#d4a72c]" style={{ width: `${(value / categoryMax) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="bg-surface-container-lowest rounded-xl shadow-sm p-5 space-y-3 lg:col-span-2">
              <h2 className="font-display text-headline-sm text-primary">Best customers</h2>
              {topCustomers.length === 0 ? (
                <p className="text-body-sm text-secondary">No sales in this period.</p>
              ) : (
                <ul className="divide-y divide-surface-container">
                  {topCustomers.map((c, i) => (
                    <li key={c.phone} className="flex items-center gap-3 py-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container text-label-md text-primary">{i + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-body-md text-on-surface">{c.name}</span>
                        <span className="block text-body-sm text-secondary">{formatPhone(c.phone)} · {c.orders} {c.orders === 1 ? 'order' : 'orders'}</span>
                      </span>
                      <span className="text-currency-md text-primary">{formatLKR(c.total)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <div className="space-y-6 lg:col-start-3 lg:row-start-1 lg:row-span-3">
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
                        <span className="text-secondary">{d.orders} {d.orders === 1 ? 'order' : 'orders'} · {formatLKR(d.sales ?? 0)}</span>
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
