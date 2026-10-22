import type { Inquiry, InquiryStatus, InquiryType, ShopSettings } from '../types'
import { get, patch, post } from '../lib/api'

// ---------------- Settings ----------------

/** What any visitor may see: shop details and the delivery zones that are switched on. */
export function getSettings(): Promise<ShopSettings> {
  return get<ShopSettings>('/settings')
}

/** Owner only: everything, including switched-off zones and every promo code. */
export function getAdminSettings(): Promise<ShopSettings> {
  return get<ShopSettings>('/admin/settings')
}

/** Owner only. Send only what changed; zone and promo lists replace the whole list. */
export function updateSettings(changes: Partial<ShopSettings>): Promise<ShopSettings> {
  return patch<ShopSettings>('/admin/settings', changes)
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
  return post<Inquiry>('/inquiries', input)
}

export function listInquiries(): Promise<Inquiry[]> {
  return get<Inquiry[]>('/admin/inquiries')
}

export function updateInquiry(id: string, changes: { status?: InquiryStatus; ownerNotes?: string }): Promise<Inquiry> {
  return patch<Inquiry>(`/admin/inquiries/${id}`, changes)
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
  return get<CustomerSummary[]>('/admin/customers')
}

export interface PasswordResetLink {
  /** The full link to send the customer: <this site>/reset-password#<token>. */
  url: string
  expiresAt: string
}

/** Owner: a one-time link (valid 30 minutes) for a registered customer who forgot their password. */
export async function createPasswordResetLink(customerId: string): Promise<PasswordResetLink> {
  const { token, expiresAt } = await post<{ token: string; expiresAt: string }>(`/admin/customers/${customerId}/password-reset`)
  return { url: `${window.location.origin}/reset-password#${token}`, expiresAt }
}
