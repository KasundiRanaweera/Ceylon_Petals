import { createContext } from 'react'
import type { CartItem, Product } from '../types'

export interface CustomCartLine {
  name: string
  imageUrl: string
  unitPrice: number
  options?: string
}

export interface CartContextValue {
  items: CartItem[]
  count: number
  subtotal: number
  /** Card message drafted on the Occasions or Hamper page, pre-filled at checkout. */
  cardMessage: string
  setCardMessage: (message: string) => void
  addProduct: (product: Product, quantity?: number) => boolean
  addCustom: (line: CustomCartLine) => void
  setQuantity: (lineId: string, quantity: number) => void
  remove: (lineId: string) => void
  clear: () => void
}

export const CartContext = createContext<CartContextValue | null>(null)
