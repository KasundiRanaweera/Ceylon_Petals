import type { Inquiry, InquiryStatus, InquiryType, ShopSettings } from '../types'
import { commit, db, delay, fail, newId, resetDb } from './mockDb'
import { isValidPhone, normalizePhone, samePhone } from '../lib/phone'

// Future endpoints:
//   GET  /api/settings (public subset)   PUT /api/admin/settings
//   POST /api/inquiries                  GET /api/admin/inquiries   PATCH /api/admin/inquiries/:id
//   GET  /api/admin/customers

// ---------------- Settings ----------------

export function getSettings(): Promise<ShopSettings> {
  return delay(db().settings, 0)
}

export function updateSettings(changes: Partial<ShopSettings>): Promise<ShopSettings> {
  if (changes.whatsappNumber !== undefined && !isValidPhone(changes.whatsappNumber)) {
    return fail('Please enter a valid WhatsApp number.')
  }
  if (changes.shopName !== undefined && !changes.shopName.trim()) return fail('Please enter the shop name.')
  if (changes.promoCodes) {
    const codes = changes.promoCodes.map((p) => p.code.trim().toUpperCase())
    if (codes.some((c) => !c)) return fail('Every promo code needs a code.')
    if (new Set(codes).size !== codes.length) return fail('Two promo codes have the same code.')
  }
  const settings = db().settings
  Object.assign(settings, changes)
  if (changes.whatsappNumber !== undefined) settings.whatsappNumber = normalizePhone(changes.whatsappNumber)
  if (changes.promoCodes) settings.promoCodes.forEach((p) => (p.code = p.code.trim().toUpperCase()))
  commit()
  return delay(settings)
}

/** Owner tool: put the demo data back to how it started. Removed once the real backend exists. */
export function resetDemoData(): Promise<void> {
  resetDb()
  return delay(undefined)
}

// ---------------- Custom inquiries (weddings, bulk, corporate, custom designs) ----------------

export interface InquiryInput {
  type: InquiryType
  name: string
  email: string
  phone: string
  eventDate?: string
  location?: string
  budget?: string
  quantity?: string
  details: string
  extra?: Record<string, string>
}

export function createInquiry(input: InquiryInput): Promise<Inquiry> {
  if (!input.name.trim()) return fail('Please enter your name.')
  if (!/^\S+@\S+\.\S+$/.test(input.email.trim())) return fail('Please enter a valid email address.')
  if (!isValidPhone(input.phone)) return fail('Please enter a valid phone number.')
  if (!input.details.trim()) return fail('Please tell us a little about what you need.')
  const data = db()
  const n = data.counters.inquiry++
  const inquiry: Inquiry = {
    ...input,
    id: newId('inq'),
    reference: `INQ-${n}`,
    phone: normalizePhone(input.phone),
    status: 'NEW',
    createdAt: new Date().toISOString(),
  }
  data.inquiries.unshift(inquiry)
  commit()
  return delay(inquiry, 400)
}

export function listInquiries(): Promise<Inquiry[]> {
  return delay(db().inquiries)
}

export function updateInquiry(id: string, changes: { status?: InquiryStatus; ownerNotes?: string }): Promise<Inquiry> {
  const inquiry = db().inquiries.find((i) => i.id === id)
  if (!inquiry) return fail('Inquiry not found.')
  Object.assign(inquiry, changes)
  commit()
  return delay(inquiry)
}

// ---------------- Customers ----------------

export interface CustomerSummary {
  id: string
  name: string
  email?: string
  phone: string
  registered: boolean
  joinedAt?: string
  orders: number
  totalSpent: number
  lastOrderAt?: string
}

/** Registered customers plus guests who have ordered, matched by phone number. */
export function listCustomers(): Promise<CustomerSummary[]> {
  const data = db()
  const result: CustomerSummary[] = data.users
    .filter((u) => u.role === 'CUSTOMER')
    .map((u) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, registered: true, joinedAt: u.createdAt, orders: 0, totalSpent: 0 }))

  for (const order of data.orders) {
    let customer =
      result.find((c) => order.customerId && c.id === order.customerId) ??
      result.find((c) => samePhone(c.phone, order.customerPhone))
    if (!customer) {
      customer = {
        id: `guest-${order.customerPhone}`,
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone,
        registered: false,
        orders: 0,
        totalSpent: 0,
      }
      result.push(customer)
    }
    customer.orders += 1
    if (order.paymentStatus === 'PAID') customer.totalSpent += order.total
    const lastOrderAt = order.createdAt ?? order.placedAt ?? ''
    if (!customer.lastOrderAt || lastOrderAt > customer.lastOrderAt) customer.lastOrderAt = lastOrderAt
  }
  return delay(result)
}
