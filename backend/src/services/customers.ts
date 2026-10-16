import { prisma } from '../lib/prisma.js'
import { samePhone } from '../lib/phone.js'

export interface CustomerSummary {
  id: string
  name: string
  email?: string
  phone: string
  /** true for people with an account, false for guests who only ordered. */
  registered: boolean
  joinedAt?: string
  orders: number
  /** Only orders that have been paid count. */
  totalSpent: number
  lastOrderAt?: string
}

/**
 * Registered customers plus guests who have ordered, matched by phone number so one person who
 * ordered as a guest and later registered is counted once.
 * (Done in memory, which is fine for a shop with thousands of orders. Move to SQL if it ever gets very large.)
 */
export async function listCustomers(): Promise<CustomerSummary[]> {
  const [users, orders] = await Promise.all([
    prisma.user.findMany({ where: { role: 'CUSTOMER' }, select: { id: true, name: true, email: true, phone: true, createdAt: true }, orderBy: { createdAt: 'desc' } }),
    prisma.order.findMany({
      select: { userId: true, customerName: true, customerPhone: true, customerEmail: true, total: true, paymentStatus: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const customers: CustomerSummary[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    registered: true,
    joinedAt: u.createdAt.toISOString(),
    orders: 0,
    totalSpent: 0,
  }))

  for (const order of orders) {
    let customer =
      (order.userId ? customers.find((c) => c.id === order.userId) : undefined) ??
      customers.find((c) => samePhone(c.phone, order.customerPhone))
    if (!customer) {
      customer = {
        id: `guest-${order.customerPhone}`,
        name: order.customerName,
        ...(order.customerEmail ? { email: order.customerEmail } : {}),
        phone: order.customerPhone,
        registered: false,
        orders: 0,
        totalSpent: 0,
      }
      customers.push(customer)
    }
    customer.orders += 1
    if (order.paymentStatus === 'PAID') customer.totalSpent += order.total
    const placed = order.createdAt.toISOString()
    if (!customer.lastOrderAt || placed > customer.lastOrderAt) customer.lastOrderAt = placed
  }
  return customers
}
