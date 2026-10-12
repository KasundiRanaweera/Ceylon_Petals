import { MapPin } from 'lucide-react'
import type { AdminOrder, OrderStatus, PaymentStatus } from '../../../types/admin'
import {
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_STYLE,
} from '../../../lib/orderStatus'
import { formatLKR } from '../../../lib/format'
import { formatDeliveryDate, formatPlacedAt } from '../../../lib/dates'
import { SLOT_LABEL } from '../../../lib/deliverySlots'
import OrderStatusSelect from './OrderStatusSelect'
import OrderActions from './OrderActions'
import PaymentAction from './PaymentAction'

interface OrdersTableProps {
  orders: AdminOrder[]
  onStatusChange: (order: AdminOrder, status: OrderStatus) => void
  onPaymentChange?: (order: AdminOrder, status: PaymentStatus) => void
}

export default function OrdersTable({ orders, onStatusChange, onPaymentChange }: OrdersTableProps) {
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto relative">
        <table className="w-full text-left min-w-[900px]">
          <thead>
            <tr className="bg-surface-container-low text-[11px] uppercase tracking-wider text-secondary">
              <th className="px-4 py-3 font-semibold">Order</th>
              <th className="px-4 py-3 font-semibold">Customer &amp; Delivery</th>
              <th className="px-4 py-3 font-semibold">Items</th>
              <th className="px-4 py-3 font-semibold">Amount &amp; Payment</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-surface-container-low/50 transition-colors align-top">
                <td className="px-4 py-3">
                  <span className="block text-title-md text-primary">{order.orderNumber}</span>
                  <span className="block text-[11px] text-secondary">Placed {formatPlacedAt(order.createdAt)}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="text-title-md text-on-surface">
                    {order.customerName}
                    {order.isOverseas && <span className="ml-2 text-[11px] text-secondary font-normal">(Overseas)</span>}
                  </div>
                  <div className="mt-0.5 flex items-start gap-1 text-body-sm text-secondary">
                    <MapPin size={14} className="mt-0.5 shrink-0" />
                    <span>{order.recipientName}, {order.area}</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-primary font-semibold">
                    {formatDeliveryDate(order.deliveryDate)} • {SLOT_LABEL[order.deliverySlot]}
                  </div>
                </td>
                <td className="px-4 py-3 max-w-[220px]">
                  <span className="block text-body-sm text-on-surface">{order.itemsSummary}</span>
                  {order.cardMessage && (
                    <span className="block text-[11px] text-secondary italic mt-0.5">“{order.cardMessage}”</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="text-currency-md text-primary">{formatLKR(order.total)}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className="text-[11px] px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                      {PAYMENT_METHOD_LABEL[order.paymentMethod]}
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${PAYMENT_STATUS_STYLE[order.paymentStatus]}`}>
                      {PAYMENT_STATUS_LABEL[order.paymentStatus]}
                    </span>
                  </div>
                  <PaymentAction order={order} onPaymentChange={onPaymentChange} />
                </td>
                <td className="px-4 py-3">
                  <OrderStatusSelect
                    status={order.status}
                    orderNumber={order.orderNumber}
                    onChange={(s) => onStatusChange(order, s)}
                  />
                </td>
                <td className="px-4 py-3">
                  <OrderActions order={order} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}