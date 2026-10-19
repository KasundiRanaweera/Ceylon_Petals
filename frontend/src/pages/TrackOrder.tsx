import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Search, MessageCircle } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import { FormError, TextField } from '../components/ui/Field'
import OrderTimeline from '../components/orders/OrderTimeline'
import OrderSummary from '../components/orders/OrderSummary'
import { trackOrder } from '../services/orders'
import { useWhatsApp } from '../hooks/useShop'

export default function TrackOrder() {
  const [params] = useSearchParams()
  const [orderNumber, setOrderNumber] = useState(params.get('order') ?? '')
  const [phone, setPhone] = useState('')
  const whatsapp = useWhatsApp()
  const lookup = useMutation({ mutationFn: () => trackOrder(orderNumber, phone) })

  function submit(e: FormEvent) {
    e.preventDefault()
    if (orderNumber.trim() && phone.trim()) lookup.mutate()
  }

  const order = lookup.data

  return (
    <div className="flex flex-col w-full">
      <PageHeader
        title="Track your order"
        subtitle="Enter your order number (e.g. CP-1049) and the phone number used for the order."
        breadcrumbs={[{ label: 'Track order' }]}
      />

      <section className="max-w-4xl mx-auto w-full px-4 lg:px-12 py-16 lg:py-24 space-y-8">
        <form onSubmit={submit} className="rounded-xl bg-surface-container-lowest ring-1 ring-outline-variant/40 shadow-[0_18px_40px_-28px_rgba(48,48,48,0.35)] p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4 items-end">
          <TextField id="track-order" label="Order number" required placeholder="CP-1049" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} />
          <TextField id="track-phone" label="Phone number" required type="tel" placeholder="077 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <button
            type="submit"
            disabled={lookup.isPending}
            className="min-h-11 h-[50px] px-6 rounded-lg btn-gradient text-label-md flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Search size={16} /> {lookup.isPending ? 'Finding…' : 'Track'}
          </button>
        </form>

        <FormError message={lookup.error ? lookup.error.message : null} />

        {order && (
          <div className="rounded-xl bg-surface-container-lowest ring-1 ring-outline-variant/40 shadow-[0_18px_40px_-28px_rgba(48,48,48,0.35)] p-6 sm:p-8 space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-headline-md text-on-surface">Order {order.orderNumber}</h2>
              <a
                href={whatsapp(`Hello! I'm asking about order ${order.orderNumber}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-label-md text-white bg-[#25D366] hover:bg-[#1EBE5D] min-h-11 px-4 py-2 rounded-lg transition-colors"
              >
                <MessageCircle size={16} /> Ask about this order
              </a>
            </div>
            <OrderTimeline order={order} />
            <div className="border-t border-outline-variant/40 pt-8">
              <OrderSummary order={order} />
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
