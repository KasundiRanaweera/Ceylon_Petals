import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Phone, MessageCircle, Printer, Copy, MapPin, CalendarClock, User, StickyNote } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import OrderStatusSelect from '../../components/admin/orders/OrderStatusSelect'
import PaymentAction from '../../components/admin/orders/PaymentAction'
import { useOrderStatusFlow } from '../../components/admin/orders/useOrderStatusFlow'
import { adminGetOrder } from '../../services/orders'
import { useShop } from '../../hooks/useShop'
import { useToast } from '../../hooks/useToast'
import { buildWhatsAppLink } from '../../lib/whatsapp'
import { formatLKR } from '../../lib/format'
import { formatLongDate, formatPlacedAt } from '../../lib/dates'
import { formatPhone } from '../../lib/phone'
import { SLOT_BY_KEY } from '../../lib/deliverySlots'
import {
  NEXT_STATUS,
  ORDER_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_STYLE,
} from '../../lib/orderStatus'

const card = 'bg-surface-container-lowest rounded-xl shadow-sm p-5 space-y-3'

export default function OrderDetail() {
  const { id = '' } = useParams<{ id: string }>()
  const { shopName } = useShop()
  const { showToast } = useToast()
  const { changeStatus, changePayment, cancelDialog, busy } = useOrderStatusFlow()
  // Shares the 'admin' key prefix, so it refreshes after every status/payment change.
  const { data: order, isLoading } = useQuery({ queryKey: ['admin', 'order', id], queryFn: () => adminGetOrder(id) })

  if (isLoading) return <div className="max-w-6xl mx-auto bg-surface-container-lowest rounded-xl h-96 animate-pulse" aria-busy="true" />
  if (!order) {
    return (
      <div className="max-w-xl mx-auto text-center space-y-3 py-16">
        <h1 className="font-display text-headline-md text-primary">Order not found</h1>
        <Link to="/admin/orders" className="text-label-md text-primary hover:underline">Back to orders</Link>
      </div>
    )
  }

  const next = NEXT_STATUS[order.status]
  const slot = SLOT_BY_KEY[order.deliverySlot]
  const history = order.statusHistory ?? []

  async function copyCardMessage() {
    try {
      await navigator.clipboard.writeText(order!.cardMessage ?? '')
      showToast('Card message copied')
    } catch {
      showToast('Could not copy — please select the text instead', 'error')
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Link to="/admin/orders" className="inline-flex items-center gap-1 text-label-md text-primary hover:underline print:hidden">
        <ArrowLeft size={15} /> All orders
      </Link>

      <AdminPageHeader
        eyebrow={`Placed ${formatPlacedAt(order.createdAt ?? order.placedAt)}`}
        title={`Order ${order.orderNumber}`}
        actions={
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <OrderStatusSelect status={order.status} orderNumber={order.orderNumber} onChange={(s) => changeStatus(order, s)} />
            {next && (
              <button
                type="button"
                disabled={busy}
                onClick={() => changeStatus(order, next)}
                className="bg-primary text-on-primary hover:bg-primary-container text-label-md px-4 py-2 rounded-lg disabled:opacity-60"
              >
                Mark as {ORDER_STATUS_LABEL[next]}
              </button>
            )}
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 bg-surface-container-high text-primary px-4 py-2 rounded-lg text-label-md hover:bg-primary hover:text-on-primary"
            >
              <Printer size={16} /> Print delivery slip
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <section className={card}>
            <h2 className="font-display text-headline-sm text-primary">Items</h2>
            <ul className="divide-y divide-surface-container">
              {(order.items ?? []).map((item, i) => (
                <li key={`${item.name}-${i}`} className="flex items-center gap-3 py-3">
                  {item.imageUrl && <img src={item.imageUrl} alt="" className="w-14 h-16 rounded-lg object-cover bg-surface-container shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-title-md text-on-surface">{item.name}</p>
                    {item.options && <p className="text-body-sm text-secondary">{item.options}</p>}
                    <p className="text-body-sm text-secondary">{formatLKR(item.unitPrice)} each</p>
                  </div>
                  <span className="text-title-md text-primary">× {item.quantity}</span>
                  <span className="w-28 text-right text-currency-md text-primary">{formatLKR(item.unitPrice * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-1 text-body-md border-t border-surface-container pt-3 max-w-xs ml-auto">
              <div className="flex justify-between"><dt className="text-secondary">Subtotal</dt><dd>{formatLKR(order.subtotal ?? 0)}</dd></div>
              {(order.discount ?? 0) > 0 && (
                <div className="flex justify-between text-emerald-700"><dt>Discount {order.promoCode && `(${order.promoCode})`}</dt><dd>− {formatLKR(order.discount ?? 0)}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-secondary">Delivery</dt><dd>{(order.deliveryFee ?? 0) ? formatLKR(order.deliveryFee ?? 0) : 'Free'}</dd></div>
              <div className="flex justify-between font-display text-headline-sm text-primary"><dt>Total</dt><dd>{formatLKR(order.total)}</dd></div>
            </dl>
          </section>

          <section className={card}>
            <h2 className="font-display text-headline-sm text-primary">Delivery</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-body-md">
              <div className="flex gap-3">
                <MapPin size={18} className="text-primary mt-1 shrink-0" />
                <div>
                  <p className="text-title-md text-on-surface">{order.recipientName}</p>
                  <p className="text-secondary">{[order.address, order.area, order.district].filter(Boolean).join(', ')}</p>
                  {order.recipientPhone && (
                    <a href={`tel:+${order.recipientPhone}`} className="inline-flex items-center gap-1 text-primary hover:underline mt-1">
                      <Phone size={14} /> {formatPhone(order.recipientPhone)}
                    </a>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <CalendarClock size={18} className="text-primary mt-1 shrink-0" />
                <div>
                  <p className="text-title-md text-on-surface">{formatLongDate(order.deliveryDate)}</p>
                  <p className="text-secondary">{slot.label}, {slot.hours}</p>
                </div>
              </div>
            </div>
            {order.cardMessage && (
              <div className="bg-surface-container-low rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] uppercase tracking-wider text-secondary">Card message</span>
                  <button type="button" onClick={copyCardMessage} className="inline-flex items-center gap-1 text-label-md text-primary hover:underline print:hidden">
                    <Copy size={14} /> Copy
                  </button>
                </div>
                <p className="font-display italic text-headline-sm text-on-surface">“{order.cardMessage}”</p>
              </div>
            )}
            {order.deliveryNotes && (
              <p className="flex items-start gap-2 text-body-md text-on-surface-variant">
                <StickyNote size={16} className="text-primary mt-1 shrink-0" /> {order.deliveryNotes}
              </p>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className={card}>
            <h2 className="font-display text-headline-sm text-primary">Customer</h2>
            <p className="flex items-center gap-2 text-title-md text-on-surface">
              <User size={16} className="text-primary" /> {order.customerName}
              {order.isOverseas && <span className="text-[11px] text-secondary font-normal">(Overseas)</span>}
            </p>
            <p className="text-body-sm text-secondary">{formatPhone(order.customerPhone)}{order.customerEmail && ` · ${order.customerEmail}`}</p>
            <p className="text-body-sm text-secondary">{order.customerId ? 'Registered customer' : 'Guest checkout'}</p>
            <div className="flex flex-wrap gap-2 print:hidden">
              <a
                href={buildWhatsAppLink(`Hello ${order.customerName}, this is ${shopName} regarding your order ${order.orderNumber}.`, order.customerPhone)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-[#25D366] text-white text-label-md px-3 py-2 rounded-lg"
              >
                <MessageCircle size={15} /> WhatsApp
              </a>
              <a href={`tel:+${order.customerPhone}`} className="inline-flex items-center gap-1.5 bg-surface-container text-primary text-label-md px-3 py-2 rounded-lg">
                <Phone size={15} /> Call
              </a>
            </div>
          </section>

          <section className={card}>
            <h2 className="font-display text-headline-sm text-primary">Payment</h2>
            <p className="text-body-md">{PAYMENT_METHOD_LABEL[order.paymentMethod]}</p>
            <span className={`inline-block text-label-md px-2.5 py-1 rounded font-semibold ${PAYMENT_STATUS_STYLE[order.paymentStatus]}`}>
              {PAYMENT_STATUS_LABEL[order.paymentStatus]}
            </span>
            <div className="print:hidden">
              <PaymentAction order={order} onPaymentChange={changePayment} />
            </div>
          </section>

          <section className={`${card} print:hidden`}>
            <h2 className="font-display text-headline-sm text-primary">History</h2>
            <ol className="space-y-2">
              {[...history].reverse().map((h, i) => (
                <li key={`${h.status}-${i}`} className="flex justify-between gap-3 text-body-sm">
                  <span className="text-on-surface">{ORDER_STATUS_LABEL[h.status]}</span>
                  <span className="text-secondary">{formatPlacedAt(h.at)}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>

      {cancelDialog}
    </div>
  )
}
