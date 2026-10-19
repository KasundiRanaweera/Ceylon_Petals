import { Check, CircleX } from 'lucide-react'
import type { AdminOrder, OrderStatus } from '../../types/admin'
import { formatPlacedAt } from '../../lib/dates'

const STEPS: { status: OrderStatus; label: string; hint: string }[] = [
  { status: 'PENDING', label: 'Order received', hint: 'We have your order' },
  { status: 'CONFIRMED', label: 'Confirmed', hint: 'Payment and details checked' },
  { status: 'PREPARING', label: 'Being prepared', hint: 'Our florists are arranging it' },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for delivery', hint: 'On the way to the recipient' },
  { status: 'DELIVERED', label: 'Delivered', hint: 'Handed over with care' },
]

// Customer-facing progress of an order (confirmation page, Track Order, My Orders).
export default function OrderTimeline({ order }: { order: AdminOrder }) {
  if (order.status === 'CANCELLED' || order.status === 'PAYMENT_FAILED') {
    return (
      <div className="flex items-start gap-3 bg-error-container/60 text-on-error-container rounded-xl p-4">
        <CircleX size={22} className="shrink-0 mt-0.5" />
        <div>
          <p className="text-title-md">{order.status === 'CANCELLED' ? 'This order was cancelled' : 'Card payment did not go through'}</p>
          <p className="text-body-sm">
            {order.status === 'CANCELLED'
              ? 'If you were charged, the refund will reach your card within 5–7 working days.'
              : 'Nothing was charged. You can try paying again, or message us on WhatsApp.'}
          </p>
        </div>
      </div>
    )
  }

  const current = STEPS.findIndex((s) => s.status === order.status)
  const reachedAt = (status: OrderStatus) => (order.statusHistory ?? []).find((h) => h.status === status)?.at

  return (
    <ol className="grid grid-cols-1 sm:grid-cols-5 gap-3 sm:gap-2">
      {STEPS.map((step, i) => {
        const done = i <= current
        const at = reachedAt(step.status)
        return (
          <li key={step.status} className="flex sm:flex-col items-start gap-3 sm:gap-2" aria-current={i === current ? 'step' : undefined}>
            <div className="flex sm:w-full items-center gap-2">
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-label-md ${
                  done ? 'bg-[#d4af37] text-on-tertiary-container' : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                {done ? <Check size={16} /> : i + 1}
              </span>
              <span className={`hidden sm:block h-0.5 flex-1 rounded ${i < current ? 'bg-[#d4af37]' : 'bg-surface-container'} ${i === STEPS.length - 1 ? 'invisible' : ''}`} />
            </div>
            <div>
              <p className={`text-title-md ${done ? 'text-on-surface' : 'text-on-surface-variant'}`}>{step.label}</p>
              <p className="text-body-sm text-secondary">{done && at ? formatPlacedAt(at) : step.hint}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
