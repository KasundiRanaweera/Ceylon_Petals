import type { CartItem } from '../types'
import type { AdminOrder, DeliverySlotKey, OrderStatus, PaymentMethod, PaymentStatus } from '../types/admin'
import { get, isMissing, patch, post } from '../lib/api'
import { orderTokenHeader, saveOrderToken } from '../lib/orderTokens'

// Checkout, tracking, the customer's own orders, and the owner's order management.
// Prices are never sent: a cart line says WHAT and HOW MANY, and the server works out the money.

export interface CheckoutInput {
  customerName: string
  customerPhone: string
  customerEmail?: string
  recipientName: string
  recipientPhone: string
  address: string
  area: string
  district: string
  deliveryDate: string
  deliverySlot: DeliverySlotKey
  cardMessage?: string
  deliveryNotes?: string
  promoCode?: string
  paymentMethod: PaymentMethod
  items: CartItem[]
}

export interface OrderQuote {
  subtotal: number
  deliveryFee: number | null
  discount: number
  total: number
  promoError?: string
}

type CartLine = { productId: string; quantity: number } | { hamper: NonNullable<CartItem['hamper']>; quantity: number }

function toLines(items: CartItem[]): CartLine[] {
  return items.map((item) => {
    if (item.hamper) return { hamper: item.hamper, quantity: item.quantity }
    if (item.productId) return { productId: item.productId, quantity: item.quantity }
    throw new Error(`${item.name} in your cart is out of date. Please remove it and add it again.`)
  })
}

/** What the server will charge. The checkout summary shows exactly this. */
export async function quoteOrder(items: CartItem[], district: string, slot: DeliverySlotKey | '', promoCode: string): Promise<OrderQuote> {
  if (items.length === 0) return { subtotal: 0, deliveryFee: null, discount: 0, total: 0 }
  return post<OrderQuote>('/orders/quote', {
    items: toLines(items),
    district,
    deliverySlot: slot,
    promoCode,
  })
}

export async function createOrder(input: CheckoutInput): Promise<AdminOrder> {
  const { items, ...rest } = input
  const { accessToken, ...order } = await post<AdminOrder & { accessToken: string }>('/orders', { ...rest, items: toLines(items) })
  // Lets this browser tab open the confirmation and payment pages for the order it just placed.
  saveOrderToken(order.orderNumber, accessToken)
  return order
}

/** An order the visitor is allowed to see: their own, or the one they just placed. Null otherwise. */
export async function getOrderByNumber(orderNumber: string): Promise<AdminOrder | null> {
  try {
    return await get<AdminOrder>(`/orders/${encodeURIComponent(orderNumber)}`, undefined, orderTokenHeader(orderNumber))
  } catch (error) {
    if (isMissing(error)) return null
    throw error
  }
}

export function trackOrder(orderNumber: string, phone: string): Promise<AdminOrder> {
  return post<AdminOrder>('/orders/track', { orderNumber, phone })
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function listMyOrders(_userId: string): Promise<AdminOrder[]> {
  return get<AdminOrder[]>('/me/orders')
}

// ---------------- Owner ----------------

export function adminListOrders(): Promise<AdminOrder[]> {
  return get<AdminOrder[]>('/admin/orders')
}

export async function adminGetOrder(id: string): Promise<AdminOrder | null> {
  try {
    return await get<AdminOrder>(`/admin/orders/${id}`)
  } catch (error) {
    if (isMissing(error)) return null
    throw error
  }
}

export function updateOrderStatus(id: string, status: OrderStatus): Promise<AdminOrder> {
  return patch<AdminOrder>(`/admin/orders/${id}/status`, { status })
}

export function updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<AdminOrder> {
  return patch<AdminOrder>(`/admin/orders/${id}/payment`, { paymentStatus })
}
