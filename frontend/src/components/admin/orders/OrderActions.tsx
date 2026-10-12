import { Link } from 'react-router-dom'
import { Receipt, MessageCircle } from 'lucide-react'
import type { AdminOrder } from '../../../types/admin'
import { buildWhatsAppLink } from '../../../lib/whatsapp'
import { useShop } from '../../../hooks/useShop'

// "View details" + "WhatsApp the customer" buttons, used in both the board and the table.
export default function OrderActions({ order }: { order: AdminOrder }) {
  const { shopName } = useShop()
  const message =
    order.status === 'DELIVERED'
      ? `Hello ${order.customerName}, your order ${order.orderNumber} has been delivered to ${order.recipientName}. Thank you for choosing ${shopName}!`
      : `Hello ${order.customerName}, this is ${shopName} regarding your order ${order.orderNumber}.`

  return (
    <div className="flex items-center gap-2">
      <Link
        to={`/admin/orders/${order.id}`}
        title="View order details"
        aria-label={`View order ${order.orderNumber}`}
        className="w-8 h-8 rounded-lg bg-surface-container-low text-primary hover:bg-primary hover:text-on-primary flex items-center justify-center transition-colors"
      >
        <Receipt size={16} />
      </Link>
      <a
        href={buildWhatsAppLink(message, order.customerPhone)}
        target="_blank"
        rel="noopener noreferrer"
        title={order.status === 'DELIVERED' ? 'Send delivery confirmation on WhatsApp' : 'Message customer on WhatsApp'}
        aria-label={`WhatsApp ${order.customerName}`}
        className="w-8 h-8 rounded-lg bg-surface-container-low text-[#25D366] hover:bg-[#25D366] hover:text-white flex items-center justify-center transition-colors"
      >
        <MessageCircle size={16} />
      </a>
    </div>
  )
}