import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { CalendarClock, Clock, Crown, HandCoins, MapPin, TrendingDown, TrendingUp, TriangleAlert } from 'lucide-react'
import Panel from '../Panel'
import { formatLKR } from '../../../lib/format'
import { SLOT_LABEL } from '../../../lib/deliverySlots'
import { isSale, ordersBySlot, percentChange, salesByDistrict, topProducts, type DayPoint } from '../../../lib/orderStats'
import type { AdminOrder, DeliverySlotKey } from '../../../types/admin'

interface Insight {
  icon: LucideIcon
  text: string
  /** where to act on it */
  to?: string
  warn?: boolean
}

// The period in a few plain sentences, each pointing at something the owner can act on:
// what is growing, what sells, where and when people want flowers, money still to collect.
export default function Insights({ orders, before, daily, against }: { orders: AdminOrder[]; before: AdminOrder[]; daily: DayPoint[]; against: string }) {
  const sales = orders.filter(isSale)
  const revenue = sales.reduce((s, o) => s + o.total, 0)
  const revenueBefore = before.filter(isSale).reduce((s, o) => s + o.total, 0)
  const list: Insight[] = []

  const pct = percentChange(revenue, revenueBefore)
  if (pct !== null && pct !== 0) {
    list.push({ icon: pct > 0 ? TrendingUp : TrendingDown, text: `Sales are ${pct > 0 ? 'up' : 'down'} ${Math.abs(pct)}% on ${against} (${formatLKR(revenue)} against ${formatLKR(revenueBefore)}).`, warn: pct < 0 })
  }

  const busiest = daily.reduce<DayPoint | undefined>((best, d) => (d.value > (best?.value ?? 0) ? d : best), undefined)
  if (busiest) list.push({ icon: CalendarClock, text: `Best day: ${busiest.date}, with ${formatLKR(busiest.value)} from ${busiest.orders} ${busiest.orders === 1 ? 'order' : 'orders'}.` })

  const [top] = topProducts(orders, 1)
  if (top) list.push({ icon: Crown, text: `Best seller: ${top.name}, ${top.quantity} sold for ${formatLKR(top.revenue)}. Keep it in stock.`, to: '/admin/inventory' })

  const [area] = salesByDistrict(orders)
  if (area && sales.length) list.push({ icon: MapPin, text: `${area.district} orders the most: ${Math.round((area.orders / sales.length) * 100)}% of orders, ${formatLKR(area.sales)}.` })

  const slots = ordersBySlot(orders)
  const [slot, slotCount] = (Object.entries(slots) as [DeliverySlotKey, number][]).sort((a, b) => b[1] - a[1])[0]!
  if (slotCount > 0) list.push({ icon: Clock, text: `Most customers pick the ${SLOT_LABEL[slot]} delivery slot (${Math.round((slotCount / sales.length) * 100)}%). Plan drivers around it.` })

  const unpaid = sales.filter((o) => o.paymentStatus === 'PENDING' && o.paymentMethod !== 'CARD')
  if (unpaid.length) {
    list.push({ icon: HandCoins, text: `${formatLKR(unpaid.reduce((s, o) => s + o.total, 0))} still to collect from ${unpaid.length} cash or WhatsApp ${unpaid.length === 1 ? 'order' : 'orders'}.`, to: '/admin/orders', warn: true })
  }

  const lost = orders.length - sales.length
  if (orders.length >= 5 && lost / orders.length >= 0.1) {
    list.push({ icon: TriangleAlert, text: `${Math.round((lost / orders.length) * 100)}% of orders were cancelled or failed to pay. Worth a look.`, to: '/admin/orders', warn: true })
  }

  return (
    <Panel title="What the numbers say" note="Worked out from this period's orders.">
      {list.length === 0 ? (
        <p className="text-body-sm text-secondary">Not enough orders in this period to say much yet.</p>
      ) : (
        <ul className="space-y-1">
          {list.map(({ icon: Icon, text, to, warn }) => {
            const body = (
              <>
                <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${warn ? 'bg-error-container text-on-error-container' : 'bg-primary-fixed text-on-primary-fixed'}`}>
                  <Icon size={15} aria-hidden="true" />
                </span>
                <span className="text-body-sm leading-relaxed text-on-surface">{text}</span>
              </>
            )
            return (
              <li key={text}>
                {to ? (
                  <Link to={to} className="-mx-2 flex gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface-container-low">{body}</Link>
                ) : (
                  <div className="flex gap-3 py-2">{body}</div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}
