import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { CartContext, type CustomCartLine } from '../../context/cartContext'
import { useToast } from '../../hooks/useToast'
import { effectivePrice } from '../../lib/pricing'
import type { CartItem, Product } from '../../types'

// The cart lives in the browser (like most shops) and is re-priced by the server at checkout.
const CART_KEY = 'ceylon-petals-cart'
const MESSAGE_KEY = 'ceylon-petals-card-message'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Cart just won't survive a reload.
  }
}

export default function CartProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast()
  const [items, setItems] = useState<CartItem[]>(() => read(CART_KEY, []))
  const [cardMessage, setCardMessage] = useState<string>(() => read(MESSAGE_KEY, ''))

  useEffect(() => write(CART_KEY, items), [items])
  useEffect(() => write(MESSAGE_KEY, cardMessage), [cardMessage])

  const addProduct = useCallback(
    (product: Product, quantity = 1) => {
      const existing = items.find((i) => i.productId === product.id)
      const wanted = (existing?.quantity ?? 0) + quantity
      if (product.stock <= 0) {
        showToast(`${product.name} is sold out right now.`, 'error')
        return false
      }
      if (wanted > product.stock) {
        showToast(`Only ${product.stock} of ${product.name} available.`, 'error')
        return false
      }
      setItems((prev) =>
        existing
          ? prev.map((i) => (i.id === existing.id ? { ...i, quantity: wanted, maxQuantity: product.stock } : i))
          : [
              ...prev,
              {
                id: product.id,
                productId: product.id,
                slug: product.slug,
                name: product.name,
                imageUrl: product.images[0],
                unitPrice: effectivePrice(product),
                quantity,
                maxQuantity: product.stock,
              },
            ]
      )
      showToast(`Added ${product.name} to your cart`)
      return true
    },
    [items, showToast]
  )

  const addCustom = useCallback(
    (line: CustomCartLine) => {
      setItems((prev) => [...prev, { ...line, id: `custom-${Date.now()}`, quantity: 1 }])
      showToast(`Added ${line.name} to your cart`)
    },
    [showToast]
  )

  const setQuantity = useCallback((lineId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== lineId) return i
        const max = i.maxQuantity ?? 99
        return { ...i, quantity: Math.min(Math.max(1, quantity), max) }
      })
    )
  }, [])

  const remove = useCallback((lineId: string) => setItems((prev) => prev.filter((i) => i.id !== lineId)), [])

  const clear = useCallback(() => {
    setItems([])
    setCardMessage('')
  }, [])

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
      cardMessage,
      setCardMessage,
      addProduct,
      addCustom,
      setQuantity,
      remove,
      clear,
    }),
    [items, cardMessage, addProduct, addCustom, setQuantity, remove, clear]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
