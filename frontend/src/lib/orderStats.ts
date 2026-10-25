import type { AdminOrder, PaymentMethod } from '../types/admin'
import { localDay } from './dates'
import { addDays, periodDays } from './period'

// Sales maths for the owner's Overview and Analytics pages.
// TODO (backend): move to GET /api/admin/stats once there are too many orders to load at once.

/** Orders that count as a sale: not cancelled and not failed. */
export function isSale(o: AdminOrder): boolean {
  return o.status !== 'CANCELLED' && o.status !== 'PAYMENT_FAILED'
}

/** Orders placed between two Colombo days, both included. */
export function ordersInPeriod(orders: AdminOrder[], p: { from: string; to: string }): AdminOrder[] {
  return orders.filter((o) => {
    const day = localDay(o.createdAt)
    return day >= p.from && day <= p.to
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

export interface DayPoint {
  /** short label for the chart axis */
  label: string
  /** the full date, for tooltips and tables */
  date: string
  value: number
  orders: number
}

/** Sales per day from one Colombo day to another, both included (days with no orders are zero). */
export function dailySales(orders: AdminOrder[], p: { from: string; to: string }): DayPoint[] {
  const days = periodDays(p)
  const byDay = new Map<string, { value: number; orders: number }>()
  for (const o of orders) {
    if (!isSale(o)) continue
    const day = localDay(o.createdAt)
    const row = byDay.get(day) ?? { value: 0, orders: 0 }
    row.value += o.total
    row.orders += 1
    byDay.set(day, row)
  }
  const multiYear = p.from.slice(0, 4) !== p.to.slice(0, 4)
  return Array.from({ length: days }, (_, i) => {
    const day = addDays(p.from, i)
    const date = new Date(`${day}T00:00:00`)
    return {
      label: days <= 7 ? date.toLocaleDateString('en-GB', { weekday: 'short' }) : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      date: date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', ...(multiYear ? { year: 'numeric' } : {}) }),
      value: byDay.get(day)?.value ?? 0,
      orders: byDay.get(day)?.orders ?? 0,
    }
  })
}

/** Sales orders per delivery slot (what time of day people want their flowers). */
export function ordersBySlot(orders: AdminOrder[]): Record<AdminOrder['deliverySlot'], number> {
  const result = { morning: 0, afternoon: 0, evening: 0, midnight: 0 }
  for (const o of orders.filter(isSale)) result[o.deliverySlot] += 1
  return result
}

/** Change from `before` to `now` in percent, or null when there is nothing to compare with. */
export function percentChange(now: number, before: number): number | null {
  if (before <= 0) return null
  return Math.round(((now - before) / before) * 100)
}
