import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { CircleCheck, MessageCircle, CircleAlert, RotateCcw } from 'lucide-react'
import NotFound from './NotFound'
import OrderTimeline from '../components/orders/OrderTimeline'
import OrderSummary from '../components/orders/OrderSummary'
import { getOrderByNumber, retryCardPayment } from '../services/orders'
import { useAuth } from '../hooks/useAuth'
import { useWhatsApp } from '../hooks/useShop'
import { placedOrderMessage } from '../lib/whatsapp'
import { formatPhone } from '../lib/phone'

export default function OrderConfirmation() {
  const { orderNumber = '' } = useParams<{ orderNumber: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const whatsapp = useWhatsApp()
  const { data: order, isLoading } = useQuery({ queryKey: ['order', orderNumber], queryFn: () => getOrderByNumber(orderNumber) })
  const retry = useMutation({
    mutationFn: () => retryCardPayment(orderNumber),
    onSuccess: () => navigate(`/payment/${orderNumber}`),
  })

  if (isLoading) return <div className="min-h-[60vh]" aria-busy="true" />
  if (!order) return <NotFound />

  const failed = order.status === 'PAYMENT_FAILED'
  const needsWhatsApp = order.paymentMethod === 'WHATSAPP' && order.status === 'PENDING'

  return (
    <section className="max-w-4xl mx-auto w-full px-4 lg:px-12 py-12 space-y-6">
      <div className="text-center space-y-3">
        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${failed ? 'bg-error-container text-error' : 'bg-primary-fixed text-primary'}`}>
          {failed ? <CircleAlert size={30} /> : <CircleCheck size={30} />}
        </div>
        <h1 className="font-display text-headline-lg text-primary">
          {failed ? 'Your payment did not go through' : needsWhatsApp ? 'One last step — send it on WhatsApp' : 'Thank you! Your order is placed'}
        </h1>
        <p className="text-body-lg text-secondary">
          Order number <strong className="text-primary">{order.orderNumber}</strong>
          {!failed && <> · We'll send updates to {formatPhone(order.customerPhone)}</>}
        </p>
      </div>

      {needsWhatsApp && (
        <div className="bg-[#25D366]/10 rounded-xl p-6 text-center space-y-3">
          <p className="text-body-md text-on-surface">
            We've saved your order. Send it to us on WhatsApp so we can confirm it and share payment details.
          </p>
          <a
            href={whatsapp(placedOrderMessage(order))}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] text-white hover:bg-[#1EBE5D] text-title-md px-6 py-3 rounded-lg"
          >
            <MessageCircle size={20} /> Send order on WhatsApp
          </a>
        </div>
      )}

      {failed && (
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => retry.mutate()}
            disabled={retry.isPending}
            className="inline-flex items-center gap-2 btn-gradient text-title-md px-6 py-3 rounded-lg  disabled:opacity-60"
          >
            <RotateCcw size={18} /> Try paying again
          </button>
          <a
            href={whatsapp(`Hello! My card payment for order ${order.orderNumber} failed. Can you help?`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] text-white text-title-md px-6 py-3 rounded-lg"
          >
            <MessageCircle size={18} /> Get help on WhatsApp
          </a>
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-6 space-y-6">
        <OrderTimeline order={order} />
        <div className="border-t border-surface-container pt-6">
          <OrderSummary order={order} />
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/shop" className="px-5 py-2.5 rounded-lg bg-surface-container text-primary text-label-md hover:bg-surface-container-high">Continue shopping</Link>
        {user?.role === 'CUSTOMER' ? (
          <Link to="/account/orders" className="px-5 py-2.5 rounded-lg bg-surface-container text-primary text-label-md hover:bg-surface-container-high">View my orders</Link>
        ) : (
          <Link to={`/track-order?order=${order.orderNumber}`} className="px-5 py-2.5 rounded-lg bg-surface-container text-primary text-label-md hover:bg-surface-container-high">
            Track this order later
          </Link>
        )}
      </div>
    </section>
  )
}
