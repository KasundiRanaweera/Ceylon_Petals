// Order types shared by the checkout, the customer account and the owner (admin) pages.
// OrderStatus / PaymentMethod / PaymentStatus should become enums in backend/prisma/schema.prisma
// with exactly these values, so the frontend and database always agree.

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'PAYMENT_FAILED'

export type PaymentMethod = 'CARD' | 'CASH_ON_DELIVERY' | 'WHATSAPP'
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
export type DateRange = 'today' | 'week' | 'month'
export type DeliverySlotKey = 'morning' | 'afternoon' | 'evening' | 'midnight'

export interface OrderItem {
  productId?: string
  slug?: string
  name: string
  imageUrl?: string
  unitPrice: number
  quantity: number
  options?: string
}

export interface StatusChange {
  status: OrderStatus
  at: string
}

export interface AdminOrder {
  id: string
  orderNumber: string
  /** ISO timestamp. */
  createdAt?: string
  /** Legacy/mock dataset uses `placedAt` for display-only timestamps. */
  placedAt?: string
  customerId?: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  isOverseas?: boolean
  recipientName: string
  recipientPhone?: string
  address?: string
  /** City / area, e.g. "Colombo 07" or "Nugegoda". */
  area: string
  district?: string
  deliveryDate: string
  deliverySlot: DeliverySlotKey
  items?: OrderItem[]
  itemsSummary: string
  cardMessage?: string
  deliveryNotes?: string
  subtotal?: number
  deliveryFee?: number
  discount?: number
  promoCode?: string
  total: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  status: OrderStatus
  statusHistory?: StatusChange[]
}

/** The same order, seen from the customer's side. */
export type Order = AdminOrder

export interface DashboardStats {
  sales: number
  salesChangePct: number | null
  onlinePaymentPct: number
  totalOrders: number
  pendingOrders: number
  inProgressOrders: number
  deliveredOrders: number
}

export interface LowStockItem {
  id: string
  name: string
  quantity: number
  threshold: number
}

export interface RecentCustomer {
  id: string
  name: string
  email: string
  joined: string
  orders: number
}

export interface DayOrders {
  day: string
  orders: number
  sales?: number
}
