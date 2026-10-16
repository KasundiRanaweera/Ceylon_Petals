// Every price rule lives here, so the quote shown at checkout and the amount actually charged
// can never disagree. Same rules as frontend/src/lib/pricing.ts.

export interface PricedProduct {
  price: number
  discountPrice?: number | null
}

/** What the customer pays for one unit: the sale price when there is a real discount. */
export function effectivePrice(product: PricedProduct): number {
  return product.discountPrice != null && product.discountPrice < product.price ? product.discountPrice : product.price
}

/** Delivery fee for a zone, or 0 when the order is large enough for free delivery. */
export function deliveryFeeFor(zone: { fee: number }, subtotal: number, freeDeliveryOver: number): number {
  return freeDeliveryOver > 0 && subtotal >= freeDeliveryOver ? 0 : zone.fee
}

export interface PromoRow {
  code: string
  type: 'PERCENT' | 'FIXED'
  value: number
  minOrder: number
  active: boolean
}

export type PromoResult = { ok: true; discount: number } | { ok: false; error: string }

/** `promo` is the promo code row found by code, or null when no such code exists. */
export function applyPromo(promo: PromoRow | null, subtotal: number): PromoResult {
  if (!promo || !promo.active) return { ok: false, error: 'This promo code is not valid.' }
  if (subtotal < promo.minOrder) {
    return { ok: false, error: `This code needs an order of at least Rs. ${promo.minOrder.toLocaleString('en-LK')}.` }
  }
  const raw = promo.type === 'PERCENT' ? Math.round((subtotal * promo.value) / 100) : promo.value
  // A discount can never be more than the goods cost.
  return { ok: true, discount: Math.min(raw, subtotal) }
}
