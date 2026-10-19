import type { Product, ShopSettings } from '../types'

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

export function deliveryFeeFor(district: string, subtotal: number, settings: ShopSettings): number | null {
  const zone = settings.deliveryZones.find((z) => z.active && z.district === district)
  if (!zone) return null
  if (settings.freeDeliveryOver > 0 && subtotal >= settings.freeDeliveryOver) return 0
  return zone.fee
}
