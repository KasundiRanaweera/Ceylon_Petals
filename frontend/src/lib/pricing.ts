import type { Product, PromoCode, ShopSettings } from '../types'

// Every price rule lives here so the cart, checkout and (later) the backend agree on totals.

export function effectivePrice(product: Pick<Product, 'price' | 'discountPrice'>): number {
  return product.discountPrice && product.discountPrice < product.price ? product.discountPrice : product.price
}

export function discountPercent(product: Pick<Product, 'price' | 'discountPrice'>): number {
  const sale = effectivePrice(product)
  return sale < product.price ? Math.round(((product.price - sale) / product.price) * 100) : 0
}

export function isLowStock(product: Pick<Product, 'stock' | 'lowStockThreshold'>): boolean {
  return product.stock > 0 && product.stock <= product.lowStockThreshold
}

export type PromoResult = { ok: true; promo: PromoCode; discount: number } | { ok: false; error: string }

export function applyPromo(code: string, subtotal: number, promos: PromoCode[]): PromoResult {
  const promo = promos.find((p) => p.code.toUpperCase() === code.trim().toUpperCase())
  if (!promo || !promo.active) return { ok: false, error: 'This promo code is not valid.' }
  if (subtotal < promo.minOrder) {
    return { ok: false, error: `This code needs an order of at least Rs. ${promo.minOrder.toLocaleString('en-LK')}.` }
  }
  const raw = promo.type === 'PERCENT' ? Math.round((subtotal * promo.value) / 100) : promo.value
  return { ok: true, promo, discount: Math.min(raw, subtotal) }
}

export function deliveryFeeFor(district: string, subtotal: number, settings: ShopSettings): number | null {
  const zone = settings.deliveryZones.find((z) => z.active && z.district === district)
  if (!zone) return null
  if (settings.freeDeliveryOver > 0 && subtotal >= settings.freeDeliveryOver) return 0
  return zone.fee
}
