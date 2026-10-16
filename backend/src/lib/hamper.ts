import { unprocessable } from './errors.js'

// "Build your own hamper". The customer picks parts; the SERVER adds up the price from this
// table. The browser never sends a price for a custom hamper, so it can never be tampered with.
//
// Same options and prices as frontend/src/components/hampers/HamperBuilder.tsx.
// TODO: move these into database tables so the owner can edit them.

interface HamperOption {
  id: string
  name: string
  price: number
}

export const HAMPER_BASES: HamperOption[] = [
  { id: 'roses', name: 'Highland Roses', price: 12000 },
  { id: 'orchids', name: 'White Orchids', price: 14500 },
  { id: 'pastel', name: 'Pastel Meadow', price: 9500 },
]

export const HAMPER_TREATS: HamperOption[] = [
  { id: 'pralines', name: 'Swiss Chocolate Pralines (16 pcs)', price: 7500 },
  { id: 'macarons', name: 'French Macarons Box (10 pcs)', price: 6800 },
  { id: 'strawberries', name: '24K Gold Glazed Strawberries', price: 8200 },
]

export const HAMPER_KEEPSAKES: HamperOption[] = [
  { id: 'teacaddy', name: 'Single Estate Tea in Brass Caddy', price: 9500 },
  { id: 'candle', name: 'Aromatherapy Candle', price: 4500 },
  { id: 'fan', name: 'Hand-carved Sandalwood Keepsake Fan', price: 5500 },
]

export interface HamperSelection {
  base: string
  treats: string[]
  keepsake?: string | null | undefined
}

export interface PricedHamper {
  name: string
  unitPrice: number
  /** Readable list of the parts, shown on the order. */
  options: string
}

function find(list: HamperOption[], id: string, what: string): HamperOption {
  const option = list.find((o) => o.id === id)
  if (!option) throw unprocessable(`The hamper in your cart has an unknown ${what}. Please rebuild it.`)
  return option
}

export function priceHamper(selection: HamperSelection): PricedHamper {
  const base = find(HAMPER_BASES, selection.base, 'flower base')
  const treats = [...new Set(selection.treats)].map((id) => find(HAMPER_TREATS, id, 'treat'))
  const keepsake = selection.keepsake ? find(HAMPER_KEEPSAKES, selection.keepsake, 'keepsake') : undefined

  const parts = [base, ...treats, ...(keepsake ? [keepsake] : [])]
  return {
    name: 'Custom-built hamper',
    unitPrice: parts.reduce((sum, p) => sum + p.price, 0),
    options: parts.map((p) => p.name).join(' + '),
  }
}
