import type { CartItem } from '../types'
import type { AdminOrder, DeliverySlotKey, OrderItem, OrderStatus, PaymentMethod, PaymentStatus } from '../types/admin'
import { commit, db, delay, fail } from './mockDb'
import { applyPromo, deliveryFeeFor, effectivePrice } from '../lib/pricing'
import { SLOT_BY_KEY, availableSlots, earliestDeliveryDate } from '../lib/deliverySlots'
import { normalizePhone, samePhone } from '../lib/phone'
import { summarise } from '../data/seed'

// Future endpoints:
//   POST  /api/orders                      (checkout — the server recalculates every price)
//   POST  /api/payments/payhere/notify     (PayHere server callback marks the order paid/failed)
//   GET   /api/orders/:orderNumber          (confirmation page, needs the session or a token)
//   POST  /api/orders/track                 { orderNumber, phone }
//   GET   /api/me/orders
//   GET   /api/admin/orders                 PATCH /api/admin/orders/:id  { status | paymentStatus }

export interface CheckoutInput {
  customerId?: string
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

/** Same maths as createOrder, so the checkout summary always matches what gets charged. */
export function quoteOrder(items: CartItem[], district: string, slot: DeliverySlotKey | '', promoCode: string): OrderQuote {
  const settings = db().settings
  const subtotal = items.reduce((sum, i) => sum + linePrice(i) * i.quantity, 0)
  const zoneFee = district ? deliveryFeeFor(district, subtotal, settings) : null
  const slotFee = slot ? SLOT_BY_KEY[slot].extraFee : 0
  const deliveryFee = zoneFee === null ? null : zoneFee + slotFee
  let discount = 0
  let promoError: string | undefined
  if (promoCode.trim()) {
    const result = applyPromo(promoCode, subtotal, settings.promoCodes)
    if (result.ok) discount = result.discount
    else promoError = result.error
  }
  return { subtotal, deliveryFee, discount, total: subtotal - discount + (deliveryFee ?? 0), promoError }
}

// Catalogue products are re-priced from the database; custom items (e.g. a built hamper) keep their price.
function linePrice(item: CartItem): number {
  if (!item.productId) return item.unitPrice
  const product = db().products.find((p) => p.id === item.productId)
  return product ? effectivePrice(product) : item.unitPrice
}

function validate(input: CheckoutInput): string | null {
  const settings = db().settings
  if (!settings.acceptingOrders) return 'We are not taking online orders right now. Please message us on WhatsApp.'
  if (input.items.length === 0) return 'Your cart is empty.'
  for (const item of input.items) {
    if (!item.productId) continue
    const p = db().products.find((x) => x.id === item.productId)
    if (!p || !p.isActive) return `${item.name} is no longer available. Please remove it from your cart.`
    if (p.stock < item.quantity) {
      return p.stock === 0
        ? `${p.name} has just sold out. Please remove it from your cart.`
        : `Only ${p.stock} of ${p.name} left. Please lower the quantity.`
    }
  }
  const zone = settings.deliveryZones.find((z) => z.active && z.district === input.district)
  if (!zone) return `We don't deliver to ${input.district || 'that district'} yet. Message us on WhatsApp and we'll try to help.`
  if (input.deliveryDate < earliestDeliveryDate(zone, settings.sameDayCutoff)) {
    return 'That delivery date is no longer available. Please pick a later date.'
  }
  if (!availableSlots(input.deliveryDate, zone).some((s) => s.key === input.deliverySlot)) {
    return 'That delivery time is no longer available. Please choose another slot.'
  }
  return null
}

function restock(order: AdminOrder) {
  for (const item of order.items ?? []) {
    const p = item.productId ? db().products.find((x) => x.id === item.productId) : undefined
    if (p) p.stock += item.quantity
  }
}

export function createOrder(input: CheckoutInput): Promise<AdminOrder> {
  const error = validate(input)
  if (error) return fail(error)

  const quote = quoteOrder(input.items, input.district, input.deliverySlot, input.promoCode ?? '')
  if (quote.promoError) return fail(quote.promoError)

  const items: OrderItem[] = input.items.map((i) => ({
    productId: i.productId,
    slug: i.slug,
    name: i.name,
    imageUrl: i.imageUrl,
    unitPrice: linePrice(i),
    quantity: i.quantity,
    options: i.options,
  }))

  const data = db()
  const n = data.counters.order++
  const now = new Date().toISOString()
  const customerPhone = normalizePhone(input.customerPhone)
  const order: AdminOrder = {
    id: String(n),
    orderNumber: `CP-${n}`,
    createdAt: now,
    customerId: input.customerId,
    customerName: input.customerName.trim(),
    customerPhone,
    customerEmail: input.customerEmail?.trim() || undefined,
    isOverseas: !customerPhone.startsWith('94'),
    recipientName: input.recipientName.trim(),
    recipientPhone: normalizePhone(input.recipientPhone),
    address: input.address.trim(),
    area: input.area.trim(),
    district: input.district,
    deliveryDate: input.deliveryDate,
    deliverySlot: input.deliverySlot,
    items,
    itemsSummary: summarise(items),
    cardMessage: input.cardMessage?.trim() || undefined,
    deliveryNotes: input.deliveryNotes?.trim() || undefined,
    subtotal: quote.subtotal,
    deliveryFee: quote.deliveryFee ?? 0,
    discount: quote.discount,
    promoCode: quote.discount > 0 ? input.promoCode?.trim().toUpperCase() : undefined,
    total: quote.total,
    paymentMethod: input.paymentMethod,
    paymentStatus: 'PENDING',
    status: 'PENDING',
    statusHistory: [{ status: 'PENDING', at: now }],
  }

  for (const item of items) {
    const p = item.productId ? data.products.find((x) => x.id === item.productId) : undefined
    if (p) p.stock -= item.quantity
  }
  data.orders.unshift(order)
  commit()
  return delay(order, 400)
}

/**
 * Stand-in for PayHere's server-to-server notify callback.
 * TODO (backend): delete this; the backend verifies the PayHere md5sig and updates the order.
 */
export function recordCardPayment(orderNumber: string, success: boolean): Promise<AdminOrder> {
  const order = db().orders.find((o) => o.orderNumber === orderNumber)
  if (!order) return fail('Order not found.')
  if (order.paymentMethod !== 'CARD') return fail('This order is not paid by card.')
  if (order.paymentStatus === 'PAID') return delay(order)
  const at = new Date().toISOString()
  if (success) {
    order.paymentStatus = 'PAID'
    order.status = 'PENDING'
  } else {
    order.paymentStatus = 'FAILED'
    order.status = 'PAYMENT_FAILED'
  }
  ;(order.statusHistory ??= []).push({ status: order.status, at })
  commit()
  return delay(order, 600)
}

/** Let a customer try paying again after a failed card payment. */
export function retryCardPayment(orderNumber: string): Promise<AdminOrder> {
  const order = db().orders.find((o) => o.orderNumber === orderNumber)
  if (!order) return fail('Order not found.')
  if (order.status !== 'PAYMENT_FAILED') return delay(order)
  order.status = 'PENDING'
  order.paymentStatus = 'PENDING'
  ;(order.statusHistory ??= []).push({ status: 'PENDING', at: new Date().toISOString() })
  commit()
  return delay(order)
}

export function getOrderByNumber(orderNumber: string): Promise<AdminOrder | null> {
  return delay(db().orders.find((o) => o.orderNumber === orderNumber.toUpperCase()) ?? null)
}

export function trackOrder(orderNumber: string, phone: string): Promise<AdminOrder> {
  const cleaned = orderNumber.trim().toUpperCase().replace(/^#/, '')
  const number = cleaned.startsWith('CP-') ? cleaned : `CP-${cleaned}`
  const order = db().orders.find((o) => o.orderNumber === number)
  if (!order || !(samePhone(order.customerPhone, phone) || (order.recipientPhone && samePhone(order.recipientPhone, phone)))) {
    return fail("We couldn't find an order with that number and phone number. Please check both and try again.")
  }
  return delay(order)
}

export function listMyOrders(userId: string): Promise<AdminOrder[]> {
  return delay(db().orders.filter((o) => o.customerId === userId))
}

// ---------------- Owner ----------------

export function adminListOrders(): Promise<AdminOrder[]> {
  return delay(db().orders)
}

export function adminGetOrder(id: string): Promise<AdminOrder | null> {
  return delay(db().orders.find((o) => o.id === id) ?? null)
}

export function updateOrderStatus(id: string, status: OrderStatus): Promise<AdminOrder> {
  const order = db().orders.find((o) => o.id === id)
  if (!order) return fail('Order not found.')
  if (order.status === status) return delay(order)
  if (status === 'CANCELLED') restock(order)
  if (order.status === 'CANCELLED') {
    // Re-opening a cancelled order takes the stock back out again.
    for (const item of order.items ?? []) {
      const p = item.productId ? db().products.find((x) => x.id === item.productId) : undefined
      if (p) p.stock = Math.max(0, p.stock - item.quantity)
    }
  }
  order.status = status
  ;(order.statusHistory ??= []).push({ status, at: new Date().toISOString() })
  commit()
  return delay(order)
}

export function updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<AdminOrder> {
  const order = db().orders.find((o) => o.id === id)
  if (!order) return fail('Order not found.')
  order.paymentStatus = paymentStatus
  commit()
  return delay(order)
}
