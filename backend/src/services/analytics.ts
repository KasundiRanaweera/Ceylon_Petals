import { prisma } from '../lib/prisma.js'
import { addDays, colomboNow } from '../lib/colomboTime.js'

// Sales numbers for the owner's Analytics page. Days are Colombo days, counted by the day the
// order was placed. Cancelled and failed orders are not sales (same rule as the frontend).

export interface AnalyticsOrder {
  createdAt: Date
  status: string
  paymentMethod: 'CARD' | 'CASH_ON_DELIVERY' | 'WHATSAPP'
  district: string
  area: string
  total: number
  items: { productId: string | null; name: string; unitPrice: number; quantity: number }[]
}

export interface AnalyticsDto {
  days: number
  from: string
  to: string
  sales: number
  orders: number
  averageOrder: number
  /** Orders in the period that were cancelled or whose payment failed. */
  cancelled: number
  previousSales: number
  /** Percent change against the period just before, or null when there was nothing to compare with. */
  changePct: number | null
  daily: { date: string; orders: number; sales: number }[]
  topProducts: { name: string; quantity: number; revenue: number }[]
  byPaymentMethod: Record<AnalyticsOrder['paymentMethod'], number>
  byDistrict: { district: string; orders: number; sales: number }[]
}

const isSale = (o: AnalyticsOrder) => o.status !== 'CANCELLED' && o.status !== 'PAYMENT_FAILED'
const dayOf = (o: AnalyticsOrder) => colomboNow(o.createdAt).date
const sum = (orders: AnalyticsOrder[]) => orders.reduce((total, o) => total + o.total, 0)

/** Pure calculation, kept apart from the database so it is easy to test. */
export function buildAnalytics(orders: AnalyticsOrder[], today: string, days: number): AnalyticsDto {
  const from = addDays(today, -(days - 1))
  const previousFrom = addDays(from, -days)
  const previousTo = addDays(from, -1)

  const inPeriod = orders.filter((o) => dayOf(o) >= from && dayOf(o) <= today)
  const sales = inPeriod.filter(isSale)
  const previousSales = sum(orders.filter((o) => isSale(o) && dayOf(o) >= previousFrom && dayOf(o) <= previousTo))
  const total = sum(sales)

  const daily = Array.from({ length: days }, (_, i) => {
    const date = addDays(from, i)
    const day = sales.filter((o) => dayOf(o) === date)
    return { date, orders: day.length, sales: sum(day) }
  })

  const products = new Map<string, { name: string; quantity: number; revenue: number }>()
  for (const order of sales) {
    for (const item of order.items) {
      const key = item.productId ?? item.name
      const row = products.get(key) ?? { name: item.name, quantity: 0, revenue: 0 }
      row.quantity += item.quantity
      row.revenue += item.unitPrice * item.quantity
      products.set(key, row)
    }
  }

  const byPaymentMethod = { CARD: 0, CASH_ON_DELIVERY: 0, WHATSAPP: 0 }
  const districts = new Map<string, { orders: number; sales: number }>()
  for (const order of sales) {
    byPaymentMethod[order.paymentMethod] += order.total
    const key = order.district || order.area
    const row = districts.get(key) ?? { orders: 0, sales: 0 }
    row.orders += 1
    row.sales += order.total
    districts.set(key, row)
  }

  return {
    days,
    from,
    to: today,
    sales: total,
    orders: sales.length,
    averageOrder: sales.length > 0 ? Math.round(total / sales.length) : 0,
    cancelled: inPeriod.length - sales.length,
    previousSales,
    changePct: previousSales > 0 ? Math.round(((total - previousSales) / previousSales) * 1000) / 10 : null,
    daily,
    topProducts: [...products.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10),
    byPaymentMethod,
    byDistrict: [...districts.entries()].map(([district, v]) => ({ district, ...v })).sort((a, b) => b.sales - a.sales),
  }
}

export async function getAnalytics(days: number, now: Date = new Date()): Promise<AnalyticsDto> {
  const today = colomboNow(now).date
  // Fetch this period and the one before it (for the comparison).
  const since = new Date(`${addDays(today, -(days * 2 - 1))}T00:00:00+05:30`)
  const rows = await prisma.order.findMany({
    where: { createdAt: { gte: since } },
    select: {
      createdAt: true, status: true, paymentMethod: true, district: true, area: true, total: true,
      items: { select: { productId: true, name: true, unitPrice: true, quantity: true } },
    },
  })
  return buildAnalytics(rows, today, days)
}
