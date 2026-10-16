import { createHash, timingSafeEqual } from 'node:crypto'
import { env } from '../config/env.js'

// PayHere signing, exactly as described in PayHere's checkout documentation.
// (PayHere requires MD5 for these signatures. It is used here only to match their format.)
//
//   checkout form hash = MD5( merchant_id + order_id + amount + currency + MD5(secret) )
//   callback signature = MD5( merchant_id + order_id + amount + currency + status_code + MD5(secret) )
//
// All MD5 values are upper-case hex. The amount is always written with two decimals ("1500.00").

const md5Upper = (text: string): string => createHash('md5').update(text).digest('hex').toUpperCase()

export const CURRENCY = 'LKR'

/** 1500 -> "1500.00" (no thousands separators, as PayHere requires). */
export const formatAmount = (rupees: number): string => rupees.toFixed(2)

export const PAYHERE_STATUS = { SUCCESS: 2, PENDING: 0, CANCELED: -1, FAILED: -2, CHARGEBACK: -3 } as const

export function checkoutHash(parts: { merchantId: string; orderId: string; amount: string; currency: string }, secret: string): string {
  return md5Upper(parts.merchantId + parts.orderId + parts.amount + parts.currency + md5Upper(secret))
}

export function notifySignature(
  parts: { merchantId: string; orderId: string; amount: string; currency: string; statusCode: string },
  secret: string
): string {
  return md5Upper(parts.merchantId + parts.orderId + parts.amount + parts.currency + parts.statusCode + md5Upper(secret))
}

/** Compares two signatures without leaking, through timing, how many characters matched. */
export function signaturesMatch(expected: string, received: string): boolean {
  const a = Buffer.from(expected.toUpperCase())
  const b = Buffer.from(received.trim().toUpperCase())
  return a.length === b.length && timingSafeEqual(a, b)
}

export interface PayhereOrder {
  orderNumber: string
  total: number
  customerName: string
  customerPhone: string
  customerEmail: string | null
  address: string
  area: string
}

/** The hidden form the browser posts to PayHere. */
export function buildCheckoutForm(order: PayhereOrder, fallbackEmail: string): { action: string; method: 'POST'; fields: Record<string, string> } {
  const { merchantId, merchantSecret, checkoutUrl, notifyUrl, returnBase } = env.payhere
  const [firstName = 'Customer', ...rest] = order.customerName.trim().split(/\s+/)
  const amount = formatAmount(order.total)

  return {
    action: checkoutUrl,
    method: 'POST',
    fields: {
      merchant_id: merchantId,
      return_url: `${returnBase}/order-confirmation/${order.orderNumber}`,
      cancel_url: `${returnBase}/payment/${order.orderNumber}`,
      notify_url: notifyUrl,
      order_id: order.orderNumber,
      items: `Flowers & gifts, order ${order.orderNumber}`,
      currency: CURRENCY,
      amount,
      first_name: firstName,
      last_name: rest.join(' ') || '-',
      // PayHere insists on an email; use the shop's own address when the customer gave none.
      email: order.customerEmail ?? fallbackEmail,
      phone: order.customerPhone,
      address: order.address,
      city: order.area,
      country: 'Sri Lanka',
      hash: checkoutHash({ merchantId, orderId: order.orderNumber, amount, currency: CURRENCY }, merchantSecret),
    },
  }
}
