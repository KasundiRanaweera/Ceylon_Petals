import type { AdminOrder, OrderStatus, PaymentStatus } from '../../../types/admin'
import { isoDate } from '../../../lib/dates'

export type DateFilter = 'today' | 'tomorrow' | 'upcoming' | 'all'
export type StatusTab = 'ALL' | OrderStatus
export type PaymentFilter = 'ALL' | PaymentStatus
export type OrdersView = 'board' | 'table'

export interface OrderFilters {
  query: string
  date: DateFilter
  status: StatusTab
  payment: PaymentFilter
}

// Opens on every date: an order due next week should be visible the moment it arrives.
export const DEFAULT_FILTERS: OrderFilters = { query: '', date: 'all', status: 'ALL', payment: 'ALL' }

function matchesDate(order: AdminOrder, date: DateFilter): boolean {
  if (date === 'all') return true
  if (date === 'today') return order.deliveryDate === isoDate(0)
  if (date === 'tomorrow') return order.deliveryDate === isoDate(1)
  return order.deliveryDate > isoDate(0) // upcoming = anything after today
}

// "Pure" filter logic, kept out of the components so it is easy to test and reuse.
export function filterOrders(orders: AdminOrder[], filters: OrderFilters, options: { ignoreStatus?: boolean } = {}): AdminOrder[] {
  const q = filters.query.trim().toLowerCase()
  return orders.filter((o) => {
    if (!matchesDate(o, filters.date)) return false
    if (!options.ignoreStatus && filters.status !== 'ALL' && o.status !== filters.status) return false
    if (filters.payment !== 'ALL' && o.paymentStatus !== filters.payment) return false
    if (!q) return true
    return [o.orderNumber, o.customerName, o.recipientName, o.area, o.itemsSummary].some((v) => v.toLowerCase().includes(q))
  })
}

export function countByStatus(orders: AdminOrder[]): Record<string, number> {
  const counts: Record<string, number> = { ALL: orders.length }
  for (const o of orders) counts[o.status] = (counts[o.status] ?? 0) + 1
  return counts
}