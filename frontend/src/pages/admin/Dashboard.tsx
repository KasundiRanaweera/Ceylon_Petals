import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { useQuery } from '@tanstack/react-query'
import { Banknote, Boxes, ChevronRight, ClipboardCheck, ClipboardList, CreditCard, HandCoins, MessageSquareText, Plus, Receipt } from 'lucide-react'
import Panel from '../../components/admin/Panel'
import ExportMenu from '../../components/admin/ExportMenu'
import KpiCard, { Delta } from '../../components/admin/overview/KpiCard'
import Insights from '../../components/admin/overview/Insights'
import TrendChart from '../../components/admin/charts/TrendChart'
import ColumnChart from '../../components/admin/charts/ColumnChart'
import BarList from '../../components/admin/charts/BarList'
import ShareBar from '../../components/admin/charts/ShareBar'
import RecentOrdersTable from '../../components/admin/overview/RecentOrdersTable'
import LowStockWatch from '../../components/admin/overview/LowStockWatch'
import RecentCustomers from '../../components/admin/overview/RecentCustomers'
import { useAdminOrders, useAdminProducts } from '../../hooks/useAdminData'
import { useAuth } from '../../hooks/useAuth'
import { listInquiries } from '../../services/shop'
import { isoDate } from '../../lib/dates'
import { formatLKR } from '../../lib/format'
import { dailySales, isSale, ordersBySlot, ordersInRange, salesByPaymentMethod, topProducts } from '../../lib/orderStats'
import { ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL } from '../../lib/orderStatus'
import { SLOT_LABEL } from '../../lib/deliverySlots'
import { RANGE_INFO } from '../../lib/reportExport'
import type { DateRange, DeliverySlotKey, OrderStatus, PaymentMethod } from '../../types/admin'

// The owner's home: what needs doing now, the period's headline numbers, the sales trend with plain
// insights beside it, where orders stand, what sells and how people pay, then the latest orders.

const TONES = {
  gold: { border: 'ring-[#c8930a]/45', icon: 'bg-[#fbe7a6] text-[#6b5200]' },
  red: { border: 'ring-error/35', icon: 'bg-error-container text-on-error-container' },
}
const RANGES: DateRange[] = ['today', 'week', 'month']
const PIPELINE: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED']
const METHODS: PaymentMethod[] = ['CARD', 'CASH_ON_DELIVERY', 'WHATSAPP']
const SLOTS: DeliverySlotKey[] = ['morning', 'afternoon', 'evening', 'midnight']
const orderWord = (n: number) => `${n} ${n === 1 ? 'order' : 'orders'}`

export default function Dashboard() {
  const [range, setRange] = useState<DateRange>('week')
  const { user } = useAuth()
  const { data: all = [], isLoading } = useAdminOrders()
  const { data: products = [], isSuccess: productsReady } = useAdminProducts()
  const lowStock = products.filter((p) => p.isActive && p.stock <= p.lowStockThreshold)
  const { data: inquiries = [] } = useQuery({ queryKey: ['admin', 'inquiries'], queryFn: listInquiries })

  // ---- greeting
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Asia/Colombo' }).format(new Date()))
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const today = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Colombo' }).format(new Date())
  // Skip placeholder names like "Shop Owner" in the greeting.
  const first = user?.name.split(' ')[0] ?? ''
  const firstName = /^(shop|owner|admin)$/i.test(first) ? '' : first
  const toDeliverToday = all.filter((o) => o.deliveryDate === isoDate(0) && ['CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'PENDING'].includes(o.status)).length

  // ---- needs attention (always now, whatever period is chosen)
  const pending = all.filter((o) => o.status === 'PENDING').length
  const paymentIssues = all.filter((o) => o.status === 'PAYMENT_FAILED' || o.paymentStatus === 'FAILED').length
  const newInquiries = inquiries.filter((q) => q.status === 'NEW').length
  const attention = [
    { label: 'to confirm', hint: 'Waiting for you', count: pending, to: '/admin/orders', icon: ClipboardCheck, tone: 'gold' as const },
    { label: paymentIssues === 1 ? 'payment issue' : 'payment issues', hint: 'Failed or unpaid', count: paymentIssues, to: '/admin/orders', icon: CreditCard, tone: 'red' as const },
    { label: 'low on stock', hint: 'Restock soon', count: lowStock.length, to: '/admin/inventory', icon: Boxes, tone: 'red' as const, loading: !productsReady },
    { label: newInquiries === 1 ? 'new inquiry' : 'new inquiries', hint: 'Requests to answer', count: newInquiries, to: '/admin/inquiries', icon: MessageSquareText, tone: 'gold' as const },
  ]

  // ---- the chosen period against the one before
  const { label: rangeLabel, days, previous: against } = RANGE_INFO[range]
  const orders = ordersInRange(all, range)
  const before = ordersInRange(all, range, 1)
  const sales = orders.filter(isSale)
  const salesBefore = before.filter(isSale)
  const revenue = sales.reduce((s, o) => s + o.total, 0)
  const revenueBefore = salesBefore.reduce((s, o) => s + o.total, 0)
  const avg = sales.length ? Math.round(revenue / sales.length) : 0
  const avgBefore = salesBefore.length ? Math.round(revenueBefore / salesBefore.length) : 0
  const unpaid = (list: typeof all) => list.filter((o) => isSale(o) && o.paymentStatus === 'PENDING' && o.paymentMethod !== 'CARD')
  const toCollect = unpaid(orders)
  const toCollectTotal = toCollect.reduce((s, o) => s + o.total, 0)
  const toCollectBefore = unpaid(before).reduce((s, o) => s + o.total, 0)

  // the charts always show at least a week, so a single day still has some shape around it
  const chartDays = Math.max(days, 7)
  const daily = dailySales(all, chartDays)
  const dailyBefore = dailySales(all, chartDays, 1).map((d) => d.value)
  const statusCount = (s: OrderStatus) => orders.filter((o) => o.status === s).length
  const lost = orders.length - sales.length
  const byMethod = salesByPaymentMethod(orders)
  const bySlot = ordersBySlot(orders)
  const top = topProducts(orders, 5)

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* ---- heading, period and actions ---- */}
      <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <span className="mb-1 block text-[11px] uppercase tracking-widest text-secondary">{today}</span>
          <h1 className="font-display text-headline-lg tracking-tight text-primary">
            {greeting}
            {firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            {toDeliverToday === 0 ? 'No deliveries left for today.' : `${toDeliverToday} ${toDeliverToday === 1 ? 'delivery' : 'deliveries'} still to go out today.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-lg bg-surface-container p-0.5" role="tablist" aria-label="Period">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                role="tab"
                aria-selected={range === r}
                onClick={() => setRange(r)}
                className={`cursor-pointer whitespace-nowrap rounded-md px-3 py-1.5 text-label-md transition-colors ${
                  range === r ? 'bg-surface-container-lowest font-bold text-primary shadow-sm' : 'text-secondary hover:text-on-surface'
                }`}
              >
                {RANGE_INFO[r].label}
              </button>
            ))}
          </div>
          <ExportMenu orders={all} products={products} range={range} disabled={isLoading} />
          <Link
            to="/admin/products/new"
            className="flex min-h-[38px] items-center gap-2 rounded-lg bg-primary px-4 py-2 text-label-md text-on-primary shadow-sm transition-colors hover:bg-primary-container"
          >
            <Plus size={17} aria-hidden="true" />
            Add product
          </Link>
        </div>
      </header>

      {/* ---- needs your attention ---- */}
      <section aria-labelledby="attention-title">
        <h2 id="attention-title" className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-secondary">Needs your attention</h2>
        <motion.ul
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
        >
          {attention.map(({ label, hint, count, to, icon: Icon, tone, loading }) => (
            <motion.li key={label} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
              <Link
                to={to}
                className={`group flex h-full items-center gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-sm ring-1 transition-shadow hover:shadow-md ${
                  count > 0 ? TONES[tone].border : 'ring-outline-variant/30'
                }`}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${count > 0 ? TONES[tone].icon : 'bg-surface-container text-secondary'}`}>
                  <Icon size={19} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="text-headline-sm font-semibold text-primary">{count}</span>
                    <span className="truncate text-body-md text-on-surface">{label}</span>
                  </span>
                  <span className="block text-[12px] text-secondary">{loading ? 'Checking…' : count > 0 ? hint : 'All clear'}</span>
                </span>
                <ChevronRight size={17} aria-hidden="true" className="shrink-0 text-outline transition-transform group-hover:translate-x-0.5" />
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      </section>

      {isLoading ? (
        <div className="space-y-6" aria-busy="true">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-44 animate-pulse rounded-xl bg-surface-container-lowest" />)}
          </div>
          <div className="h-80 animate-pulse rounded-xl bg-surface-container-lowest" />
        </div>
      ) : (
        <>
          {/* ---- headline numbers for the period ---- */}
          <section aria-labelledby="kpi-title">
            <h2 id="kpi-title" className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-secondary">
              {rangeLabel} <span className="font-normal normal-case tracking-normal">· compared with {against}</span>
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                title="Sales"
                icon={Banknote}
                value={formatLKR(revenue)}
                trend={daily.map((d) => d.value)}
                trendLabel={`Sales per day, last ${chartDays} days`}
                footer={<Delta now={revenue} before={revenueBefore} against={against} />}
              />
              <KpiCard
                title="Orders"
                icon={ClipboardList}
                value={String(sales.length)}
                trend={daily.map((d) => d.orders)}
                trendLabel={`Orders per day, last ${chartDays} days`}
                footer={<Delta now={sales.length} before={salesBefore.length} against={against} />}
              />
              <KpiCard
                title="Average order"
                icon={Receipt}
                value={formatLKR(avg)}
                trend={daily.map((d) => (d.orders ? Math.round(d.value / d.orders) : 0))}
                trendLabel={`Average order per day, last ${chartDays} days`}
                footer={<Delta now={avg} before={avgBefore} against={against} />}
              />
              <KpiCard
                title="Still to collect"
                icon={HandCoins}
                alert={toCollectTotal > 0}
                value={formatLKR(toCollectTotal)}
                footer={
                  <div className="space-y-1">
                    <p className="text-[12px] text-on-surface">{toCollect.length === 0 ? 'Nothing outstanding.' : `${orderWord(toCollect.length)} paid by cash or WhatsApp, not marked paid.`}</p>
                    <Delta now={toCollectTotal} before={toCollectBefore} against={against} lowerIsBetter />
                  </div>
                }
              />
            </div>
          </section>

          {/* ---- the trend, with what it means beside it ---- */}
          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <TrendChart title={`Sales per day, last ${chartDays} days`} points={daily} previous={dailyBefore} previousLabel={`The ${chartDays} days before`} height={280} />
            </div>
            <Insights orders={orders} before={before} daily={daily} against={against} />
          </div>

          {/* ---- where orders stand, what sells, how people pay ---- */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            <Panel
              title="Order progress"
              note={`Orders placed ${rangeLabel.toLowerCase()}, by where they are now.`}
              action={<Link to="/admin/orders" className="text-label-md text-primary hover:underline">Orders</Link>}
            >
              <BarList rows={PIPELINE.map((s) => ({ key: s, label: ORDER_STATUS_LABEL[s], value: statusCount(s), valueText: orderWord(statusCount(s)) }))} empty="No orders in this period." />
              <p className="mt-4 border-t border-surface-container pt-3 text-[12px] text-secondary">
                {lost === 0 ? 'No cancelled or failed orders.' : `${orderWord(lost)} cancelled or failed (${Math.round((lost / orders.length) * 100)}%).`}
              </p>
            </Panel>
            <Panel title="Best sellers" note="By sales in this period." action={<Link to="/admin/analytics" className="text-label-md text-primary hover:underline">Analytics</Link>}>
              <BarList rows={top.map((p) => ({ key: p.name, label: p.name, hint: `${p.quantity} sold`, value: p.revenue, valueText: formatLKR(p.revenue) }))} empty="No sales in this period." />
            </Panel>
            <Panel title="How customers pay" note="Share of sales in this period." className="md:col-span-2 xl:col-span-1">
              {revenue === 0 ? (
                <p className="text-body-sm text-secondary">No sales in this period.</p>
              ) : (
                <ShareBar slices={METHODS.map((m) => ({ key: m, label: PAYMENT_METHOD_LABEL[m], value: byMethod[m], valueText: formatLKR(byMethod[m]) }))} />
              )}
              <div className="mt-6 border-t border-surface-container pt-4">
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-secondary">Delivery slots chosen</h3>
                <ColumnChart
                  columns={SLOTS.map((s) => ({ label: SLOT_LABEL[s].replace(' Surprise', ''), detail: SLOT_LABEL[s], value: bySlot[s] }))}
                  describe={orderWord}
                  height={130}
                  ariaLabel={`Orders by delivery slot: ${SLOTS.map((s) => `${SLOT_LABEL[s]} ${bySlot[s]}`).join(', ')}`}
                />
              </div>
            </Panel>
          </div>

          {/* ---- the latest orders, stock and customers ---- */}
          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <RecentOrdersTable orders={all.slice(0, 8)} />
            </div>
            <div className="space-y-6">
              <LowStockWatch products={products} />
              <RecentCustomers />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
