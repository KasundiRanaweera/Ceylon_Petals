import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { useQuery } from '@tanstack/react-query'
import { Boxes, ChevronRight, ClipboardCheck, CreditCard, MessageSquareText, Plus } from 'lucide-react'
import StatsRow from '../../components/admin/overview/StatsRow'
import RecentOrdersTable from '../../components/admin/overview/RecentOrdersTable'
import OrdersThisWeekChart from '../../components/admin/overview/OrdersThisWeekChart'
import LowStockWatch from '../../components/admin/overview/LowStockWatch'
import RecentCustomers from '../../components/admin/overview/RecentCustomers'
import { useAdminOrders, useAdminProducts } from '../../hooks/useAdminData'
import { useAuth } from '../../hooks/useAuth'
import { listInquiries } from '../../services/shop'
import { isoDate } from '../../lib/dates'
import type { DateRange } from '../../types/admin'

const TONES = {
  gold: { border: 'border-[#c8930a]/40', icon: 'bg-tertiary-fixed text-tertiary' },
  red: { border: 'border-error/30', icon: 'bg-error-container text-on-error-container' },
}

const RANGES: { id: DateRange; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
]

export default function Dashboard() {
  const [range, setRange] = useState<DateRange>('month')
  const { user } = useAuth()
  const { data: orders = [] } = useAdminOrders()
  const { data: products = [], isSuccess: productsReady } = useAdminProducts()
  const lowStock = products.filter((p) => p.isActive && p.stock <= p.lowStockThreshold)
  const { data: inquiries = [] } = useQuery({ queryKey: ['admin', 'inquiries'], queryFn: listInquiries })

  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Asia/Colombo' }).format(new Date()))
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const today = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Colombo' }).format(new Date())
  // Skip placeholder names like "Shop Owner" in the greeting.
  const first = user?.name.split(' ')[0] ?? ''
  const firstName = /^(shop|owner|admin)$/i.test(first) ? '' : first
  const toDeliverToday = orders.filter((o) => o.deliveryDate === isoDate(0) && ['CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'PENDING'].includes(o.status)).length

  const pending = orders.filter((o) => o.status === 'PENDING').length
  const paymentIssues = orders.filter((o) => o.status === 'PAYMENT_FAILED' || o.paymentStatus === 'FAILED').length
  const newInquiries = inquiries.filter((q) => q.status === 'NEW').length
  const attention = [
    { label: 'to confirm', hint: 'Waiting for you', count: pending, to: '/admin/orders', icon: ClipboardCheck, tone: 'gold' as const },
    { label: paymentIssues === 1 ? 'payment issue' : 'payment issues', hint: 'Failed or unpaid', count: paymentIssues, to: '/admin/orders', icon: CreditCard, tone: 'red' as const },
    { label: 'low on stock', hint: 'Restock soon', count: lowStock.length, to: '/admin/inventory', icon: Boxes, tone: 'red' as const, loading: !productsReady },
    { label: newInquiries === 1 ? 'new inquiry' : 'new inquiries', hint: 'Requests to answer', count: newInquiries, to: '/admin/inquiries', icon: MessageSquareText, tone: 'gold' as const },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] text-secondary tracking-widest uppercase block mb-1">{today}</span>
          <h1 className="font-display text-headline-lg text-primary tracking-tight">
            {greeting}
            {firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            {toDeliverToday === 0
              ? 'No deliveries left for today.'
              : `${toDeliverToday} ${toDeliverToday === 1 ? 'delivery' : 'deliveries'} still to go out today.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-surface-container rounded-lg p-0.5" role="tablist" aria-label="Date range">
            {RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                role="tab"
                aria-selected={range === r.id}
                onClick={() => setRange(r.id)}
                className={`px-3 py-1 rounded text-label-md transition-all ${
                  range === r.id ? 'bg-surface-container-lowest text-primary font-bold shadow-sm' : 'text-secondary hover:text-on-surface'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <Link
            to="/admin/products/new"
            className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg text-label-md hover:bg-primary-container transition-all shadow-sm"
          >
            <Plus size={18} />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      <section aria-labelledby="attention-title">
        <h2 id="attention-title" className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-secondary">Needs your attention</h2>
        <motion.ul
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        >
          {attention.map(({ label, hint, count, to, icon: Icon, tone, loading }) => (
            <motion.li key={label} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
              <Link
                to={to}
                className={`group flex h-full items-center gap-3 rounded-xl border bg-surface-container-lowest p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  count > 0 ? TONES[tone].border : 'border-transparent'
                }`}
              >
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${count > 0 ? TONES[tone].icon : 'bg-surface-container text-secondary'}`}>
                  <Icon size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="text-headline-sm font-semibold tabular-nums text-primary">{count}</span>
                    <span className="text-title-md leading-snug text-on-surface">{label}</span>
                  </span>
                  <span className="block text-body-sm text-secondary">{loading ? 'Checking…' : count > 0 ? hint : 'All clear'}</span>
                </span>
                <ChevronRight size={18} className="shrink-0 text-outline transition-transform group-hover:translate-x-0.5" />
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      </section>

      <StatsRow range={range} orders={orders} products={products} productsReady={productsReady} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <div className="xl:col-span-2">
          <RecentOrdersTable orders={orders.slice(0, 8)} />
        </div>
        <div className="space-y-6">
          <OrdersThisWeekChart orders={orders} />
          <LowStockWatch products={products} />
          <RecentCustomers />
        </div>
      </div>
    </div>
  )
}