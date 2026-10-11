import { useContext } from 'react'
import { CartContext } from '../context/cartContext'

// Usage: const { items, addProduct, count } = useCart()
export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}
