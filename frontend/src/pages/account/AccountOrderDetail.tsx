import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, MessageCircle, RotateCcw } from 'lucide-react'
import NotFound from '../NotFound'
import OrderTimeline from '../../components/orders/OrderTimeline'
import OrderSummary from '../../components/orders/OrderSummary'
import { listMyOrders } from '../../services/orders'
import { listProducts } from '../../services/catalog'
import { useAuth } from '../../hooks/useAuth'
import { useCart } from '../../hooks/useCart'
import { useWhatsApp } from '../../hooks/useShop'
import { formatPlacedAt } from '../../lib/dates'

export default function AccountOrderDetail() {
  const { orderNumber = '' } = useParams<{ orderNumber: string }>()
  const { user } = useAuth()
  const { addProduct } = useCart()
  const whatsapp = useWhatsApp()
  const { data: orders, isLoading } = useQuery({
    queryKey: ['me', 'orders', user?.id],
    queryFn: () => listMyOrders(user!.id),
    enabled: Boolean(user),
  })
  const { data: products = [] } = useQuery({ queryKey: ['products', {}], queryFn: () => listProducts() })

  if (isLoading || !orders) return <div className="rounded-xl bg-surface-container-lowest ring-1 ring-outline-variant/40 shadow-[0_18px_40px_-28px_rgba(48,48,48,0.35)] h-64 animate-pulse" aria-busy="true" />
  // Only the customer's own orders are visible here.
  const order = orders.find((o) => o.orderNumber === orderNumber)
  if (!order) return <NotFound />

  const reorderable = (order.items ?? [])
    .map((i) => ({ item: i, product: products.find((p) => p.id === i.productId) }))
    .filter((x) => x.product && x.product.stock > 0)

  function reorder() {
    for (const { item, product } of reorderable) addProduct(product!, Math.min(item.quantity, product!.stock))
  }

  return (
    <div className="space-y-4">
      <Link to="/account/orders" className="inline-flex min-h-11 items-center gap-1 text-label-md text-tertiary underline-offset-4 hover:underline">
        <ArrowLeft size={15} /> All orders
      </Link>
      <div className="rounded-xl bg-surface-container-lowest ring-1 ring-outline-variant/40 shadow-[0_18px_40px_-28px_rgba(48,48,48,0.35)] p-6 sm:p-8 space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-headline-md text-on-surface">Order {order.orderNumber}</h2>
            <p className="mt-1 text-body-sm text-on-surface-variant">Placed {formatPlacedAt(order.createdAt ?? order.placedAt)}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {reorderable.length > 0 && (
              <button type="button" onClick={reorder} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#d4af37] px-5 py-2.5 text-label-md text-tertiary transition-colors hover:bg-[#d4af37] hover:text-on-tertiary-container">
                <RotateCcw size={15} /> Order again
              </button>
            )}
            <a
              href={whatsapp(`Hello! I'm asking about my order ${order.orderNumber}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 px-5 py-2.5 rounded-lg bg-[#25D366] text-white text-label-md transition-colors hover:bg-[#1ebe5a]"
            >
              <MessageCircle size={15} /> Ask about this order
            </a>
          </div>
        </div>
        <OrderTimeline order={order} />
        <div className="border-t border-outline-variant/40 pt-8">
          <OrderSummary order={order} />
        </div>
      </div>
    </div>
  )
}
