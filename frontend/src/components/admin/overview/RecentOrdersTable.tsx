import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { AdminOrder } from '../../../types/admin'
import { ORDER_STATUS_LABEL, ORDER_STATUS_STYLE, PAYMENT_STATUS_LABEL, PAYMENT_STATUS_STYLE } from '../../../lib/orderStatus'
import { formatLKR } from '../../../lib/format'
import { formatDeliveryDate, formatPlacedAt } from '../../../lib/dates'
import { SLOT_LABEL } from '../../../lib/deliverySlots'

// The newest orders at a glance. Status changes happen on the Orders page (with its safety checks).
export default function RecentOrdersTable({ orders }: { orders: AdminOrder[] }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 flex items-center justify-between gap-3 border-b border-surface-container">
        <h2 className="font-display text-headline-sm text-primary">Recent Orders</h2>
        <Link to="/admin/orders" className="text-label-md text-primary hover:underline">Manage orders</Link>
      </div>

      {orders.length === 0 ? (
        <p className="text-center text-body-sm text-secondary py-10">No orders yet.</p>
      ) : (
        <ul className="divide-y divide-surface-container">
          {orders.map((o) => (
            <li key={o.id}>
              <Link to={`/admin/orders/${o.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-surface-container-low/60 transition-colors">
                <div className="w-24 shrink-0">
                  <span className="block text-title-md text-primary">{o.orderNumber}</span>
                  <span className="block text-[11px] text-secondary">{formatPlacedAt(o.createdAt ?? o.placedAt)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-md text-on-surface truncate">
                    {o.customerName}
                    {o.isOverseas && <span className="ml-2 text-[11px] text-secondary">(Overseas)</span>}
                  </p>
                  <p className="text-body-sm text-secondary truncate">
                    {o.itemsSummary} · {formatDeliveryDate(o.deliveryDate)}, {SLOT_LABEL[o.deliverySlot]}
                  </p>
                </div>
                <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                  <span className="text-currency-md text-primary">{formatLKR(o.total)}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${PAYMENT_STATUS_STYLE[o.paymentStatus]}`}>{PAYMENT_STATUS_LABEL[o.paymentStatus]}</span>
                </div>
                <span className={`text-[11px] px-2 py-1 rounded-lg font-semibold shrink-0 ${ORDER_STATUS_STYLE[o.status]}`}>{ORDER_STATUS_LABEL[o.status]}</span>
                <ChevronRight size={16} className="text-outline shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
