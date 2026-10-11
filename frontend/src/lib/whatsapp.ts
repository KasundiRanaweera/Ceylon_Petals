import type { CartItem, Product } from '../types'
import type { AdminOrder } from '../types/admin'
import { formatLKR } from './format'
import { effectivePrice } from './pricing'
import { formatLongDate } from './dates'
import { SLOT_BY_KEY } from './deliverySlots'

// Builds WhatsApp click-to-chat links and the pre-filled order messages customers send.
// The shop's number comes from Settings (see useWhatsApp in hooks/useShop.ts).

export function buildWhatsAppLink(message: string, number: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

function productUrl(slug: string) {
  return `${window.location.origin}/product/${slug}`
}

export function productOrderMessage(product: Product, quantity = 1): string {
  return [
    `Hello! I'd like to order:`,
    ``,
    `• ${product.name} × ${quantity} — ${formatLKR(effectivePrice(product) * quantity)}`,
    productUrl(product.slug),
    ``,
    `Delivery area: `,
    `Delivery date: `,
    `Card message: `,
  ].join('\n')
}

export function cartOrderMessage(items: CartItem[], subtotal: number, cardMessage: string): string {
  return [
    `Hello! I'd like to order these from your website:`,
    ``,
    ...items.map((i) => `• ${i.name} × ${i.quantity} — ${formatLKR(i.unitPrice * i.quantity)}${i.options ? `\n   (${i.options})` : ''}`),
    ``,
    `Subtotal: ${formatLKR(subtotal)} (plus delivery)`,
    ``,
    `Delivery area: `,
    `Delivery date: `,
    `Card message: ${cardMessage}`,
  ].join('\n')
}

/** Sent after a "WhatsApp order" checkout, so the owner can match the chat to the order. */
export function placedOrderMessage(order: AdminOrder): string {
  return [
    `Hello! I've placed order ${order.orderNumber} on your website and would like to confirm it on WhatsApp.`,
    ``,
    ...(order.items ?? []).map((i) => `• ${i.name} × ${i.quantity}`),
    `Total: ${formatLKR(order.total)}`,
    ``,
    `Deliver to: ${order.recipientName}, ${order.address}, ${order.area}, ${order.district}`,
    `When: ${formatLongDate(order.deliveryDate)}, ${SLOT_BY_KEY[order.deliverySlot].label} (${SLOT_BY_KEY[order.deliverySlot].hours})`,
    order.cardMessage ? `Card message: "${order.cardMessage}"` : '',
  ]
    .filter((line, i, all) => line !== '' || all[i - 1] !== '')
    .join('\n')
}
