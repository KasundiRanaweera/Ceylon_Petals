import type { ShopSettings } from '../types'

// Sentences about delivery and the studio, built from the owner's Settings, so the storefront
// always says what the shop actually offers.

/** Districts that get same-day delivery right now. */
export function sameDayDistricts(shop: ShopSettings): string[] {
  return shop.deliveryZones.filter((z) => z.active && z.sameDay).map((z) => z.district)
}

/** Districts we deliver to the next day (or later). */
export function laterDistricts(shop: ShopSettings): string[] {
  return shop.deliveryZones.filter((z) => z.active && !z.sameDay).map((z) => z.district)
}

/** "Colombo", "Colombo & Gampaha", "Colombo, Gampaha & Kalutara". */
export function listWords(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} & ${items[items.length - 1]}`
}

/** The area part of the studio address, e.g. "42 Flower Road, Colombo 07, Sri Lanka" -> "Colombo 07". */
export function studioArea(address: string): string {
  const parts = address
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p && !/^sri lanka$/i.test(p))
  return parts[parts.length - 1] ?? ''
}

/** The cheapest delivery fee, for "delivery from Rs. 500". */
export function lowestFee(shop: ShopSettings): number | null {
  const fees = shop.deliveryZones.filter((z) => z.active).map((z) => z.fee)
  return fees.length ? Math.min(...fees) : null
}
