import type { AdminOrder, DateRange, DayOrders, PaymentMethod } from '../types/admin'
import { isoDate, localDay } from './dates'

// Sales maths for the owner's Overview and Analytics pages.
// TODO (backend): move to GET /api/admin/stats once there are too many orders to load at once.

const RANGE_DAYS: Record<DateRange, number> = { today: 1, week: 7, month: 30 }

/** Orders that count as a sale: not cancelled and not failed. */
export function isSale(o: AdminOrder): boolean {
  return o.status !== 'CANCELLED' && o.status !== 'PAYMENT_FAILED'
}

function placedBetween(o: AdminOrder, fromDay: string, toDay: string) {
  const day = localDay(o.createdAt)
  return day >= fromDay && day <= toDay
}

export function ordersInRange(orders: AdminOrder[], range: DateRange, periodsBack = 0): AdminOrder[] {
  const days = RANGE_DAYS[range]
  const to = isoDate(-days * periodsBack)
  const from = isoDate(-days * periodsBack - (days - 1))
  return orders.filter((o) => placedBetween(o, from, to))
}

export interface DashboardStats {
  sales: number
  salesChangePct: number | null
  onlinePaymentPct: number
  totalOrders: number
  pendingOrders: number
  inProgressOrders: number
  deliveredOrders: number
}

export function dashboardStats(orders: AdminOrder[], range: DateRange): DashboardStats {
  const current = ordersInRange(orders, range).filter(isSale)
  const previous = ordersInRange(orders, range, 1).filter(isSale)
  const sales = current.reduce((sum, o) => sum + o.total, 0)
  const prevSales = previous.reduce((sum, o) => sum + o.total, 0)
  const cardSales = current.filter((o) => o.paymentMethod === 'CARD').reduce((sum, o) => sum + o.total, 0)
  return {
    sales,
    salesChangePct: prevSales > 0 ? Math.round(((sales - prevSales) / prevSales) * 1000) / 10 : null,
    onlinePaymentPct: sales > 0 ? Math.round((cardSales / sales) * 100) : 0,
    totalOrders: current.length,
    pendingOrders: current.filter((o) => o.status === 'PENDING').length,
    inProgressOrders: current.filter((o) => ['CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY'].includes(o.status)).length,
    deliveredOrders: current.filter((o) => o.status === 'DELIVERED').length,
  }
}

/** One bar per day for the last `days` days, by the day the order was placed. */
export function ordersByDay(orders: AdminOrder[], days: number): DayOrders[] {
  return Array.from({ length: days }, (_, i) => {
    const day = isoDate(i - (days - 1))
    const sales = orders.filter((o) => isSale(o) && localDay(o.createdAt) === day)
    const date = new Date(`${day}T00:00:00`)
    return {
      day: days <= 7 ? date.toLocaleDateString('en-GB', { weekday: 'short' }) : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      orders: sales.length,
      sales: sales.reduce((sum, o) => sum + o.total, 0),
    }
  })
}

export function topProducts(orders: AdminOrder[], limit = 5) {
  const totals = new Map<string, { name: string; quantity: number; revenue: number }>()
  for (const o of orders.filter(isSale)) {
    for (const i of o.items ?? []) {
      const key = i.productId ?? i.name
      const row = totals.get(key) ?? { name: i.name, quantity: 0, revenue: 0 }
      row.quantity += i.quantity
      row.revenue += i.unitPrice * i.quantity
      totals.set(key, row)
    }
  }
  return [...totals.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit)
}

export function salesByPaymentMethod(orders: AdminOrder[]): Record<PaymentMethod, number> {
  const result: Record<PaymentMethod, number> = { CARD: 0, CASH_ON_DELIVERY: 0, WHATSAPP: 0 }
  for (const o of orders.filter(isSale)) result[o.paymentMethod] += o.total
  return result
}

export function salesByDistrict(orders: AdminOrder[]) {
  const map = new Map<string, { orders: number; sales: number }>()
  for (const o of orders.filter(isSale)) {
    const key = o.district ?? o.area
    const row = map.get(key) ?? { orders: 0, sales: 0 }
    row.orders += 1
    row.sales += o.total
    map.set(key, row)
  }
  return [...map.entries()].map(([district, v]) => ({ district, ...v })).sort((a, b) => b.sales - a.sales)
}
