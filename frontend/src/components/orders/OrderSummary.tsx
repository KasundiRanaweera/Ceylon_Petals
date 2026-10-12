import { Link } from 'react-router-dom'
import { MapPin, CalendarClock, PenLine, CreditCard } from 'lucide-react'
import type { AdminOrder } from '../../types/admin'
import { formatLKR } from '../../lib/format'
import { formatLongDate } from '../../lib/dates'
import { SLOT_BY_KEY } from '../../lib/deliverySlots'
import { PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL, PAYMENT_STATUS_STYLE } from '../../lib/orderStatus'
import { sizedImage } from '../../lib/images'

// Items, delivery details and totals of one order, as the customer sees them.
export default function OrderSummary({ order }: { order: AdminOrder }) {
  const slot = SLOT_BY_KEY[order.deliverySlot]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <ul className="space-y-3">
          {(order.items ?? []).map((item, i) => (
            <li key={`${item.name}-${i}`} className="flex gap-3">
              {item.imageUrl && <img src={sizedImage(item.imageUrl, 200)} alt="" className="w-14 h-16 rounded-lg object-cover bg-surface-container shrink-0" />}
              <div className="flex-1 min-w-0">
                {item.slug ? (
                  <Link to={`/product/${item.slug}`} className="text-title-md text-primary hover:underline">{item.name}</Link>
                ) : (
                  <p className="text-title-md text-primary">{item.name}</p>
                )}
                {item.options && <p className="text-body-sm text-secondary">{item.options}</p>}
                <p className="text-body-sm text-secondary">Qty {item.quantity} × {formatLKR(item.unitPrice)}</p>
              </div>
            </li>
          ))}
        </ul>
        <dl className="space-y-1.5 text-body-md border-t border-surface-container pt-3">
          <div className="flex justify-between"><dt className="text-secondary">Subtotal</dt><dd>{formatLKR(order.subtotal ?? 0)}</dd></div>
          {(order.discount ?? 0) > 0 && (
            <div className="flex justify-between text-emerald-700"><dt>Discount{order.promoCode ? ` (${order.promoCode})` : ''}</dt><dd>− {formatLKR(order.discount ?? 0)}</dd></div>
          )}
          <div className="flex justify-between"><dt className="text-secondary">Delivery</dt><dd>{(order.deliveryFee ?? 0) === 0 ? 'Free' : formatLKR(order.deliveryFee ?? 0)}</dd></div>
          <div className="flex justify-between font-display text-headline-sm text-primary pt-1"><dt>Total</dt><dd>{formatLKR(order.total)}</dd></div>
        </dl>
      </div>

      <div className="space-y-4 text-body-md">
        <div className="flex gap-3">
          <MapPin size={18} className="text-primary mt-1 shrink-0" />
          <div>
            <p className="text-title-md text-primary">Delivering to {order.recipientName}</p>
            <p className="text-secondary">{[order.address, order.area, order.district].filter(Boolean).join(', ')}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <CalendarClock size={18} className="text-primary mt-1 shrink-0" />
          <div>
            <p className="text-title-md text-primary">{formatLongDate(order.deliveryDate)}</p>
            <p className="text-secondary">{slot.label}, {slot.hours}</p>
          </div>
        </div>
        {order.cardMessage && (
          <div className="flex gap-3">
            <PenLine size={18} className="text-primary mt-1 shrink-0" />
            <p className="italic text-on-surface-variant">“{order.cardMessage}”</p>
          </div>
        )}
        <div className="flex gap-3">
          <CreditCard size={18} className="text-primary mt-1 shrink-0" />
          <div className="flex flex-wrap items-center gap-2">
            <span>{PAYMENT_METHOD_LABEL[order.paymentMethod]}</span>
            <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${PAYMENT_STATUS_STYLE[order.paymentStatus]}`}>
              {PAYMENT_STATUS_LABEL[order.paymentStatus]}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
