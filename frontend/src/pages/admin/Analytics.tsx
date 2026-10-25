import { useState } from 'react'
import { Banknote, ClipboardList, HandCoins, Minus, Receipt, RotateCcw, TrendingDown, TrendingUp, Wallet, XCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { adminListCategories } from '../../services/catalog'
import { formatPhone } from '../../lib/phone'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import StatCard from '../../components/admin/StatCard'
import Panel from '../../components/admin/Panel'
import ExportMenu from '../../components/admin/ExportMenu'
import TrendChart from '../../components/admin/charts/TrendChart'
import ColumnChart from '../../components/admin/charts/ColumnChart'
import BarList from '../../components/admin/charts/BarList'
import ShareBar from '../../components/admin/charts/ShareBar'
import { useAdminOrders, useAdminProducts } from '../../hooks/useAdminData'
import { formatLKR } from '../../lib/format'
import { dailySales, isSale, ordersBySlot, ordersInRange, percentChange, salesByDistrict, salesByPaymentMethod, topProducts } from '../../lib/orderStats'
import { PAYMENT_METHOD_LABEL } from '../../lib/orderStatus'
import { SLOT_LABEL } from '../../lib/deliverySlots'
import type { DateRange, DeliverySlotKey, PaymentMethod } from '../../types/admin'

const RANGES: { id: DateRange; label: string; days: number; previous: string }[] = [
  { id: 'today', label: 'Today', days: 1, previous: 'yesterday' },
  { id: 'week', label: 'Last 7 days', days: 7, previous: 'the 7 days before' },
  { id: 'month', label: 'Last 30 days', days: 30, previous: 'the 30 days before' },
]
const SLOTS: DeliverySlotKey[] = ['morning', 'afternoon', 'evening', 'midnight']
const METHODS: PaymentMethod[] = ['CARD', 'CASH_ON_DELIVERY', 'WHATSAPP']

// "Up 12% on the 30 days before", with an arrow and words, so the change never relies on colour alone.
function Change({ now, before, against }: { now: number; before: number; against: string }) {
  const pct = percentChange(now, before)
  if (pct === null) return <p className="text-[12px] text-secondary">Nothing to compare with {against}</p>
  const Icon = pct > 0 ? TrendingUp : pct < 0 ? TrendingDown : Minus
  const tone = pct > 0 ? 'text-emerald-700 dark:text-emerald-400' : pct < 0 ? 'text-error' : 'text-secondary'
  return (
    <p className="flex items-center gap-1 text-[12px] text-secondary">
      <Icon size={14} aria-hidden="true" className={tone} />
      <span className={`font-semibold ${tone}`}>{pct > 0 ? 'Up' : pct < 0 ? 'Down' : 'No change'}{pct !== 0 && ` ${Math.abs(pct)}%`}</span>
      <span>on {against}</span>
    </p>
  )
}

export default function Analytics() {
  const [range, setRange] = useState<DateRange>('month')
  const { data: all = [], isLoading } = useAdminOrders()
  const { days, previous: against } = RANGES.find((r) => r.id === range)!
  const orders = ordersInRange(all, range)
  const before = ordersInRange(all, range, 1)
  const sales = orders.filter(isSale)
  const salesBefore = before.filter(isSale)
  const revenue = sales.reduce((s, o) => s + o.total, 0)
  const revenueBefore = salesBefore.reduce((s, o) => s + o.total, 0)
  const avg = sales.length ? Math.round(revenue / sales.length) : 0
  const avgBefore = salesBefore.length ? Math.round(revenueBefore / salesBefore.length) : 0
  const cancelled = orders.length - sales.length

  // the charts always show at least a week, so a single day still has some shape around it
  const chartDays = Math.max(days, 7)
  const daily = dailySales(all, chartDays)
  const dailyBefore = dailySales(all, chartDays, 1).map((d) => d.value)
  const bySlot = ordersBySlot(orders)
  const byMethod = salesByPaymentMethod(orders)
  const top = topProducts(orders, 6)
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

  // ---- Best customers in this period (guests and account holders, matched by phone).
  const spend = new Map<string, { name: string; phone: string; orders: number; total: number }>()
  for (const o of sales) {
    const row = spend.get(o.customerPhone) ?? { name: o.customerName, phone: o.customerPhone, orders: 0, total: 0 }
    row.orders += 1
    row.total += o.total
    spend.set(o.customerPhone, row)
  }
  const topCustomers = [...spend.values()].sort((a, b) => b.total - a.total).slice(0, 5)
  const orderWord = (n: number) => `${n} ${n === 1 ? 'order' : 'orders'}`

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <AdminPageHeader
        eyebrow="Reports"
        title="Analytics"
        subtitle="Sales and orders, counted by the day each order was placed. Cancelled and failed orders are not counted as sales."
        actions={
          <>
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
          <ExportMenu orders={all} products={products} range={range} disabled={isLoading} />
          </>
        }
      />

      {isLoading ? (
        <div className="space-y-6" aria-busy="true">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-32 rounded-xl bg-surface-container-lowest animate-pulse" />)}
          </div>
          <div className="h-72 rounded-xl bg-surface-container-lowest animate-pulse" />
        </div>
      ) : (
        <>
          {/* ---- the headline numbers, each compared with the period before ---- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard title="Sales" icon={Banknote} footer={<Change now={revenue} before={revenueBefore} against={against} />}>
              <div className="font-display text-headline-md text-primary">{formatLKR(revenue)}</div>
            </StatCard>
            <StatCard title="Orders" icon={ClipboardList} footer={<Change now={sales.length} before={salesBefore.length} against={against} />}>
              <div className="font-display text-headline-md text-primary">{sales.length}</div>
            </StatCard>
            <StatCard title="Average order" icon={Receipt} footer={<Change now={avg} before={avgBefore} against={against} />}>
              <div className="font-display text-headline-md text-primary">{formatLKR(avg)}</div>
            </StatCard>
            <StatCard title="Cancelled / failed" icon={XCircle} alert={cancelled > 0} footer={<p className="text-[12px] text-secondary">{orders.length ? `${Math.round((cancelled / orders.length) * 100)}% of all orders placed` : 'No orders in this period'}</p>}>
              <div className="font-display text-headline-md text-primary">{cancelled}</div>
            </StatCard>
          </div>

          {/* ---- money in, money still to collect, money given back ---- */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard title="Paid so far" icon={Wallet}>
              <div className="text-headline-md font-semibold text-emerald-800 dark:text-emerald-400">{formatLKR(collected)}</div>
              <p className="text-body-sm text-secondary">Card payments and cash or transfers you have marked paid.</p>
            </StatCard>
            <StatCard title="Still to collect" icon={HandCoins} alert={toCollectTotal > 0}>
              <div className="text-headline-md font-semibold text-primary">{formatLKR(toCollectTotal)}</div>
              <p className="text-body-sm text-secondary">
                {toCollect.length === 0 ? 'Nothing outstanding.' : `${orderWord(toCollect.length)} paid by cash or WhatsApp, not marked paid yet.`}
              </p>
            </StatCard>
            <StatCard title="Refunded" icon={RotateCcw}>
              <div className="text-headline-md font-semibold text-primary">{formatLKR(refunded)}</div>
              <p className="text-body-sm text-secondary">Money returned to customers in this period.</p>
            </StatCard>
          </div>

          {/* ---- the trend ---- */}
          <TrendChart
            title={`Sales per day, last ${chartDays} days`}
            points={daily}
            previous={dailyBefore}
            previousLabel={`The ${chartDays} days before`}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Panel title="Orders per day" note={`Last ${chartDays} days. Hover a bar for the day.`}>
              <ColumnChart
                columns={daily.map((d) => ({ label: d.label, detail: d.date, value: d.orders }))}
                describe={orderWord}
                ariaLabel={`Orders per day: ${daily.map((d) => `${d.date} ${d.orders}`).join(', ')}`}
              />
            </Panel>
            <Panel title="When customers want delivery" note="Orders in this period, by delivery slot.">
              <ColumnChart
                columns={SLOTS.map((s) => ({ label: SLOT_LABEL[s].replace(' Surprise', ''), detail: SLOT_LABEL[s], value: bySlot[s] }))}
                describe={orderWord}
                ariaLabel={`Orders by delivery slot: ${SLOTS.map((s) => `${SLOT_LABEL[s]} ${bySlot[s]}`).join(', ')}`}
              />
            </Panel>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Panel title="Best sellers" note="By sales in this period.">
              <BarList
                rows={top.map((p) => ({ key: p.name, label: p.name, hint: `${p.quantity} sold`, value: p.revenue, valueText: formatLKR(p.revenue) }))}
                empty="No sales in this period."
              />
            </Panel>
            <Panel title="Sales by category">
              <BarList rows={categoryRows.map(([name, value]) => ({ key: name, label: name, value, valueText: formatLKR(value) }))} empty="No sales in this period." />
            </Panel>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Panel title="How customers pay">
              {revenue === 0 ? (
                <p className="text-body-sm text-secondary">No sales in this period.</p>
              ) : (
                <ShareBar slices={METHODS.map((m) => ({ key: m, label: PAYMENT_METHOD_LABEL[m], value: byMethod[m], valueText: formatLKR(byMethod[m]) }))} />
              )}
            </Panel>
            <Panel title="Top delivery areas">
              <BarList
                rows={districts.map((d) => ({ key: d.district, label: d.district, hint: orderWord(d.orders), value: d.sales ?? 0, valueText: formatLKR(d.sales ?? 0) }))}
                empty="No deliveries in this period."
              />
            </Panel>
            <Panel title="Best customers">
              {topCustomers.length === 0 ? (
                <p className="text-body-sm text-secondary">No sales in this period.</p>
              ) : (
                <ol className="divide-y divide-surface-container">
                  {topCustomers.map((c, i) => (
                    <li key={c.phone} className="flex items-center gap-3 py-2.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-container text-[12px] font-semibold text-primary">{i + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-body-md text-on-surface">{c.name}</span>
                        <span className="block text-[12px] text-secondary">{formatPhone(c.phone)} · {orderWord(c.orders)}</span>
                      </span>
                      <span className="text-body-sm font-semibold tabular-nums text-on-surface">{formatLKR(c.total)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  )
}
