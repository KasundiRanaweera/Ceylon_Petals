import type { Prisma } from '../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'
import { notFound, unprocessable } from '../lib/errors.js'
import { orderInclude, parseOrderNumber, toOrderDto, type OrderDto } from './orders.js'

// What the owner does with orders: list them, move them through the stages, cancel, and record
// payments that happen outside the website (cash, bank transfer, refunds).
//
// Stock follows the order: an order "holds" stock from the moment it is placed until it is
// cancelled or its payment fails. Moving an order in or out of those states keeps the shelf count right.

type Db = Prisma.TransactionClient
type OrderStatus = OrderDto['status']
type PaymentStatus = OrderDto['paymentStatus']

/** Statuses the owner can choose by hand. PAYMENT_FAILED is only ever set by the payment system. */
export const OWNER_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] as const
export type OwnerStatus = (typeof OWNER_STATUSES)[number]

const HOLDS_STOCK = new Set<OrderStatus>(['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'])

// ---------------------------------------------------------------- reading

export interface ListOrdersOptions {
  /** Only orders placed on or after this date (YYYY-MM-DD, Colombo time). */
  since?: string | undefined
  /** Newest first, at most this many. */
  limit: number
}

export async function adminListOrders({ since, limit }: ListOrdersOptions): Promise<OrderDto[]> {
  const rows = await prisma.order.findMany({
    where: since ? { createdAt: { gte: new Date(`${since}T00:00:00+05:30`) } } : {},
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: orderInclude,
  })
  return rows.map(toOrderDto)
}

export async function adminGetOrder(id: string): Promise<OrderDto> {
  const number = parseOrderNumber(id)
  const row = number === null ? null : await prisma.order.findUnique({ where: { number }, include: orderInclude })
  if (!row) throw notFound('Order not found')
  return toOrderDto(row)
}

// ---------------------------------------------------------------- status

async function takeStockForReopen(tx: Db, items: { productId: string | null; name: string; quantity: number }[]) {
  for (const item of items) {
    if (!item.productId) continue
    const taken = await tx.product.updateMany({
      where: { id: item.productId, stock: { gte: item.quantity } },
      data: { stock: { decrement: item.quantity } },
    })
    if (taken.count === 0) {
      throw unprocessable(`There is not enough stock of "${item.name}" to reopen this order. Add stock first, then try again.`)
    }
  }
}

export async function changeOrderStatus(id: string, status: OwnerStatus): Promise<OrderDto> {
  const number = parseOrderNumber(id)
  if (number === null) throw notFound('Order not found')

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { number }, include: { items: true } })
    if (!order) throw notFound('Order not found')
    if (order.status === status) return

    // A card order is only real once PayHere says it is paid. Until then it can wait, or be cancelled.
    if (order.paymentMethod === 'CARD' && order.paymentStatus !== 'PAID' && status !== 'PENDING' && status !== 'CANCELLED') {
      throw unprocessable('This card order has not been paid yet. Wait for the payment to arrive, or cancel the order.')
    }

    const was = HOLDS_STOCK.has(order.status)
    const will = HOLDS_STOCK.has(status)
    if (was && !will) {
      for (const item of order.items) {
        if (item.productId) await tx.product.updateMany({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } })
      }
    } else if (!was && will) {
      await takeStockForReopen(tx, order.items)
    }

    await tx.order.update({ where: { id: order.id }, data: { status } })
    await tx.orderStatusHistory.create({ data: { orderId: order.id, status } })
  })

  return adminGetOrder(id)
}

// ---------------------------------------------------------------- payment

/** Payment states the owner can set. FAILED belongs to the payment system. */
export const OWNER_PAYMENT_STATUSES = ['PENDING', 'PAID', 'REFUNDED'] as const
export type OwnerPaymentStatus = (typeof OWNER_PAYMENT_STATUSES)[number]

/**
 * Records money handled outside the website.
 *  - Mark as paid:     cash on delivery and WhatsApp orders, once the money is collected.
 *  - Mark as refunded: after you have returned the money (for card orders, through PayHere's dashboard).
 *  - Back to unpaid:   only to undo a "paid" mistake on a cash or WhatsApp order.
 * Card payments are confirmed by PayHere, never by hand.
 */
export async function changePaymentStatus(id: string, target: OwnerPaymentStatus): Promise<OrderDto> {
  const number = parseOrderNumber(id)
  if (number === null) throw notFound('Order not found')

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { number } })
    if (!order) throw notFound('Order not found')
    const current: PaymentStatus = order.paymentStatus
    if (current === target) return

    const isCard = order.paymentMethod === 'CARD'
    if (target === 'PAID') {
      if (isCard) throw unprocessable('Card payments are confirmed automatically by PayHere.')
      if (current !== 'PENDING') throw unprocessable('Only an unpaid order can be marked as paid.')
      await tx.order.update({ where: { id: order.id }, data: { paymentStatus: 'PAID', paidAt: new Date() } })
    } else if (target === 'REFUNDED') {
      if (current !== 'PAID') throw unprocessable('Only a paid order can be marked as refunded.')
      await tx.order.update({ where: { id: order.id }, data: { paymentStatus: 'REFUNDED' } })
    } else {
      if (isCard) throw unprocessable('Card payments are confirmed automatically by PayHere.')
      if (current !== 'PAID') throw unprocessable('Only a paid order can be set back to unpaid.')
      await tx.order.update({ where: { id: order.id }, data: { paymentStatus: 'PENDING', paidAt: null } })
    }
  })

  return adminGetOrder(id)
}
