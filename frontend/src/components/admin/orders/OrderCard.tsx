import { MapPin } from 'lucide-react'
import type { AdminOrder, OrderStatus, PaymentStatus } from '../../../types/admin'
import {
  NEXT_STATUS,
  ORDER_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_STYLE,
} from '../../../lib/orderStatus'
import { formatLKR } from '../../../lib/format'
import { formatDeliveryDate, formatPlacedAt } from '../../../lib/dates'
import OrderStatusSelect from './OrderStatusSelect'
import OrderActions from './OrderActions'
import PaymentAction from './PaymentAction'

interface OrderCardProps {
  order: AdminOrder
  showDate: boolean
  onStatusChange: (order: AdminOrder, status: OrderStatus) => void
  onPaymentChange?: (order: AdminOrder, status: PaymentStatus) => void
}

export default function OrderCard({ order, showDate, onStatusChange, onPaymentChange }: OrderCardProps) {
  const next = NEXT_STATUS[order.status]

  return (
    <article className="bg-surface-container-lowest rounded-xl shadow-sm p-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="block whitespace-nowrap text-title-md text-primary">{order.orderNumber}</span>
          <span className="block text-[11px] text-secondary">
            {showDate ? `${formatDeliveryDate(order.deliveryDate)} • ` : ''}Placed {formatPlacedAt(order.createdAt ?? order.placedAt)}
          </span>
        </div>
        <OrderStatusSelect
          status={order.status}
          orderNumber={order.orderNumber}
          onChange={(s) => onStatusChange(order, s)}
        />
      </div>

      <div className="space-y-1">
        <p className="text-title-md text-on-surface">
          {order.customerName}
          {order.isOverseas && <span className="ml-2 text-[11px] text-secondary font-normal">(Overseas)</span>}
        </p>
        <p className="text-body-sm text-on-surface">{order.itemsSummary}</p>
        <p className="flex items-start gap-1 text-body-sm text-secondary">
          <MapPin size={14} className="mt-0.5 shrink-0" />
          <span>{order.recipientName}, {order.area}</span>
        </p>
        {order.cardMessage && (
          <p className="text-[11px] text-secondary italic line-clamp-2 bg-surface-container-low rounded px-2 py-1">
            “{order.cardMessage}”
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="whitespace-nowrap text-currency-md text-primary">{formatLKR(order.total)}</span>
        <div className="flex flex-wrap justify-end gap-1">
          <span className="text-[11px] px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
            {PAYMENT_METHOD_LABEL[order.paymentMethod]}
          </span>
          <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${PAYMENT_STATUS_STYLE[order.paymentStatus]}`}>
            {PAYMENT_STATUS_LABEL[order.paymentStatus]}
          </span>
        </div>
      </div>

      <PaymentAction order={order} onPaymentChange={onPaymentChange} />

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-surface-container">
        {next ? (
          <button
            type="button"
            onClick={() => onStatusChange(order, next)}
            className="flex-1 bg-primary text-on-primary hover:bg-primary-container text-label-md py-2 rounded-lg transition-colors"
          >
            Mark as {ORDER_STATUS_LABEL[next]}
          </button>
        ) : (
          <span className="flex-1 text-[11px] text-secondary">No further steps</span>
        )}
        <OrderActions order={order} />
      </div>
    </article>
  )
}