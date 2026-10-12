import type { AdminOrder, OrderStatus, PaymentStatus } from '../../../types/admin'
import { DELIVERY_SLOTS } from '../../../lib/deliverySlots'
import { isoDate } from '../../../lib/dates'
import OrderCard from './OrderCard'

interface OrderBoardProps {
  orders: AdminOrder[]
  onStatusChange: (order: AdminOrder, status: OrderStatus) => void
  onPaymentChange?: (order: AdminOrder, status: PaymentStatus) => void
}

// One column per delivery slot, so the florist can see what to prepare and when it goes out.
export default function OrderBoard({ orders, onStatusChange, onPaymentChange }: OrderBoardProps) {
  const today = isoDate(0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4 items-start">
      {DELIVERY_SLOTS.map((slot) => {
        const slotOrders = orders.filter((o) => o.deliverySlot === slot.key)
        return (
          <section key={slot.key} className="bg-surface-container-low rounded-xl p-3 space-y-3" aria-label={`${slot.label} orders`}>
            <header className="flex items-start justify-between gap-2 px-1">
              <div>
                <h3 className="font-display text-headline-sm text-primary">{slot.label}</h3>
                <p className="text-[11px] text-secondary">{slot.hours}</p>
              </div>
              <span className="bg-surface-container-lowest text-primary text-label-md rounded-sm px-2.5 py-0.5">
                {slotOrders.length}
              </span>
            </header>

            {slotOrders.length === 0 ? (
              <p className="text-body-sm text-secondary text-center py-8">No orders in this slot.</p>
            ) : (
              slotOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  showDate={order.deliveryDate !== today}
                  onStatusChange={onStatusChange}
                  onPaymentChange={onPaymentChange}
                />
              ))
            )}
          </section>
        )
      })}
    </div>
  )
}