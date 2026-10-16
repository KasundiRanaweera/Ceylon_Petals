import type { Prisma } from '../generated/prisma/client.js'
import { env } from '../config/env.js'
import { prisma } from '../lib/prisma.js'
import { badRequest, notFound, serviceUnavailable, unprocessable } from '../lib/errors.js'
import { CURRENCY, PAYHERE_STATUS, buildCheckoutForm, notifySignature, signaturesMatch } from '../lib/payhere.js'
import { findOrderRowForViewer, orderInclude, parseOrderNumber, toOrderDto, type OrderDto, type Viewer } from './orders.js'
import { getSettingsRow } from './settings.js'

// Card payments through PayHere.
//
// The customer's browser is NEVER trusted to say "I paid". An order is only marked paid when
// PayHere's own server calls us (the "notify" callback) with a signature that only PayHere and
// we can produce, and the amount matches the order. Everything below is built around that.

type Db = Prisma.TransactionClient
type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: true } }>

// ---------------------------------------------------------------- stock helpers

/** Puts the stock of an order's products back on sale. */
async function releaseStock(db: Db, items: OrderWithItems['items']) {
  for (const item of items) {
    if (!item.productId) continue // custom hampers have no stock
    await db.product.updateMany({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } })
  }
}

/**
 * Takes stock again for an order whose stock had been released, because a payment arrived late.
 * The customer has already paid, so the order stands; if the stock is no longer there it is
 * set to 0 (the shop is one short) rather than failing, and the owner is told in the log.
 */
async function retakeStock(db: Db, order: OrderWithItems) {
  for (const item of order.items) {
    if (!item.productId) continue
    const taken = await db.product.updateMany({
      where: { id: item.productId, stock: { gte: item.quantity } },
      data: { stock: { decrement: item.quantity } },
    })
    if (taken.count === 0) {
      await db.product.updateMany({ where: { id: item.productId }, data: { stock: 0 } })
      console.warn(`[payments] CP-${order.number}: paid after expiry and "${item.name}" is short of stock. The owner must fix this order by hand.`)
    }
  }
}

// ---------------------------------------------------------------- applying a payment result

export type PaymentOutcome = { kind: 'paid'; reference: string | null } | { kind: 'failed' } | { kind: 'chargeback' }

/**
 * Moves a card order to its new state. Safe to call twice with the same outcome (PayHere does
 * resend notifications), and safe when two arrive at once: each change only happens if the order
 * is still in the state we expect, checked by the database in the same statement.
 */
export async function applyPaymentOutcome(orderId: string, outcome: PaymentOutcome): Promise<'applied' | 'ignored'> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } })
    if (!order || order.paymentMethod !== 'CARD') return 'ignored'

    if (outcome.kind === 'paid') {
      const wasFailed = order.status === 'PAYMENT_FAILED'
      const claimed = await tx.order.updateMany({
        where: { id: orderId, paymentStatus: { not: 'PAID' } },
        data: {
          paymentStatus: 'PAID',
          paidAt: new Date(),
          paymentReference: outcome.reference,
          // Paid after the order had been marked failed (e.g. it expired): bring it back to life.
          ...(wasFailed ? { status: 'PENDING' } : {}),
        },
      })
      if (claimed.count === 0) return 'ignored' // already paid: a repeated notification
      if (wasFailed) {
        await tx.orderStatusHistory.create({ data: { orderId, status: 'PENDING' } })
        await retakeStock(tx, order)
      }
      // A payment that arrives for an order the owner already cancelled stays CANCELLED + PAID,
      // which the owner's Orders page shows as "needs a refund".
      return 'applied'
    }

    if (outcome.kind === 'failed') {
      // Only an order that is still waiting for payment can fail. A paid, cancelled or already failed order is left alone.
      const claimed = await tx.order.updateMany({
        where: { id: orderId, status: 'PENDING', paymentStatus: 'PENDING' },
        data: { status: 'PAYMENT_FAILED', paymentStatus: 'FAILED' },
      })
      if (claimed.count === 0) return 'ignored'
      await tx.orderStatusHistory.create({ data: { orderId, status: 'PAYMENT_FAILED' } })
      await releaseStock(tx, order.items)
      return 'applied'
    }

    // chargeback: the bank took the money back.
    const claimed = await tx.order.updateMany({ where: { id: orderId, paymentStatus: 'PAID' }, data: { paymentStatus: 'REFUNDED' } })
    if (claimed.count === 1) console.warn(`[payments] CP-${order.number}: the payment was charged back by the customer's bank.`)
    return claimed.count === 1 ? 'applied' : 'ignored'
  })
}

// ---------------------------------------------------------------- starting a payment

export type PaymentStart =
  | { mode: 'simulated' }
  | { mode: 'sandbox' | 'live'; action: string; method: 'POST'; fields: Record<string, string> }

/** Brings a failed card order back to "waiting for payment" so the customer can try again. */
async function reopenFailedOrder(orderId: string) {
  await prisma.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({
      where: { id: orderId, status: 'PAYMENT_FAILED', paymentStatus: { not: 'PAID' } },
      data: { status: 'PENDING', paymentStatus: 'PENDING' },
    })
    if (claimed.count === 0) return

    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } })
    // The stock was released when payment failed, so take it again. If it has gone, throwing here
    // undoes the whole retry and the order stays failed.
    for (const item of order.items) {
      if (!item.productId) continue
      const taken = await tx.product.updateMany({
        where: { id: item.productId, isActive: true, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      })
      if (taken.count === 0) {
        throw unprocessable(`${item.name} is no longer available in that quantity, so this order can't be paid now. Please place a new order.`)
      }
    }
    await tx.orderStatusHistory.create({ data: { orderId, status: 'PENDING' } })
  })
}

/** Step 1 of paying by card: the signed form the browser sends to PayHere. */
export async function startCardPayment(orderNumber: string, viewer: Viewer): Promise<PaymentStart> {
  const order = await findOrderRowForViewer(orderNumber, viewer)

  if (order.paymentMethod !== 'CARD') throw unprocessable('This order is not paid by card.')
  if (order.paymentStatus === 'PAID') throw unprocessable('This order has already been paid.')
  if (order.status === 'CANCELLED') throw unprocessable('This order was cancelled.')
  if (env.payhere.mode === 'disabled') {
    throw serviceUnavailable('Card payment is not available right now. Please message us on WhatsApp to pay another way.')
  }

  if (order.status === 'PAYMENT_FAILED') await reopenFailedOrder(order.id)
  if (env.payhere.mode === 'simulated') return { mode: 'simulated' }

  const settings = await getSettingsRow()
  const form = buildCheckoutForm({ ...order, orderNumber: `CP-${order.number}` }, settings.email)
  return { mode: env.payhere.mode, ...form }
}

// ---------------------------------------------------------------- PayHere's callback

export type NotifyFields = Partial<Record<string, string>>

/**
 * PayHere calls this by itself (not through the customer's browser) after every payment attempt.
 * Throws when the message is not genuine; otherwise returns normally, so the route answers "OK"
 * and PayHere stops resending.
 */
export async function handlePayhereNotification(fields: NotifyFields): Promise<void> {
  const { merchant_id, order_id, payment_id, payhere_amount, payhere_currency, status_code, md5sig } = fields
  if (!merchant_id || !order_id || !payhere_amount || !payhere_currency || !status_code || !md5sig) {
    throw badRequest('Missing payment fields')
  }

  // 1. Is it really from PayHere? Only someone who knows our merchant secret can make this signature.
  const expected = notifySignature(
    { merchantId: merchant_id, orderId: order_id, amount: payhere_amount, currency: payhere_currency, statusCode: status_code },
    env.payhere.merchantSecret
  )
  if (merchant_id !== env.payhere.merchantId || !signaturesMatch(expected, md5sig)) {
    console.warn(`[payments] rejected a payment notification with a bad signature (order_id=${order_id})`)
    throw badRequest('Invalid signature')
  }

  // 2. Is it about one of our orders, for the right amount?
  const number = parseOrderNumber(order_id)
  const order = number === null ? null : await prisma.order.findUnique({ where: { number } })
  if (!order) {
    console.warn(`[payments] signed notification for an unknown order (${order_id})`)
    return
  }
  if (payhere_currency !== CURRENCY || Math.round(Number(payhere_amount) * 100) !== order.total * 100) {
    console.error(`[payments] CP-${order.number}: amount mismatch. Paid ${payhere_currency} ${payhere_amount}, expected ${CURRENCY} ${order.total}. NOT marked paid.`)
    return
  }

  // 3. Apply the result.
  const code = Number(status_code)
  if (code === PAYHERE_STATUS.SUCCESS) await applyPaymentOutcome(order.id, { kind: 'paid', reference: payment_id ?? null })
  else if (code === PAYHERE_STATUS.CANCELED || code === PAYHERE_STATUS.FAILED) await applyPaymentOutcome(order.id, { kind: 'failed' })
  else if (code === PAYHERE_STATUS.CHARGEBACK) await applyPaymentOutcome(order.id, { kind: 'chargeback' })
  // status 0 = still processing: nothing to do yet, PayHere will call again.
}

// ---------------------------------------------------------------- development gateway

export type SimulatedResult = 'success' | 'failed' | 'cancelled'

/**
 * Stands in for PayHere while PAYHERE_MODE=simulated, so the whole checkout can be tried without
 * a PayHere account. Refused in every other mode. It still needs the same access to the order
 * as viewing it does.
 */
export async function simulatePayment(orderNumber: string, viewer: Viewer, result: SimulatedResult): Promise<OrderDto> {
  if (env.payhere.mode !== 'simulated') throw notFound('Not found')
  const order = await findOrderRowForViewer(orderNumber, viewer)
  if (order.paymentMethod !== 'CARD') throw unprocessable('This order is not paid by card.')

  await applyPaymentOutcome(
    order.id,
    result === 'success' ? { kind: 'paid', reference: `SIMULATED-${Date.now()}` } : { kind: 'failed' }
  )
  const fresh = await prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: orderInclude })
  return toOrderDto(fresh)
}

// ---------------------------------------------------------------- abandoned payments

/**
 * Card orders that were never paid hold stock. After the payment window (30 minutes by default)
 * they are marked failed and the stock goes back on sale. If the customer does pay later,
 * the notification above brings the order back.
 */
export async function expireUnpaidCardOrders(now: Date = new Date(), minutes: number = env.payhere.windowMinutes): Promise<number> {
  const cutoff = new Date(now.getTime() - minutes * 60_000)
  const stale = await prisma.order.findMany({
    where: { paymentMethod: 'CARD', paymentStatus: 'PENDING', status: 'PENDING', updatedAt: { lt: cutoff } },
    select: { id: true },
  })
  let expired = 0
  for (const { id } of stale) {
    if ((await applyPaymentOutcome(id, { kind: 'failed' })) === 'applied') expired++
  }
  return expired
}
