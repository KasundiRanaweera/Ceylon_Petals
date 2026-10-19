import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Package, ChevronRight } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import { listMyOrders } from '../../services/orders'
import { useAuth } from '../../hooks/useAuth'
import { formatLKR } from '../../lib/format'
import { formatLongDate, formatPlacedAt } from '../../lib/dates'
import { ORDER_STATUS_LABEL, ORDER_STATUS_STYLE } from '../../lib/orderStatus'
import { sizedImage } from '../../lib/images'

const ACTIVE = ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY']

export default function AccountOrders() {
  const { user } = useAuth()
  const { data: orders, isLoading } = useQuery({
    queryKey: ['me', 'orders', user?.id],
    queryFn: () => listMyOrders(user!.id),
    enabled: Boolean(user),
  })

  if (isLoading || !orders) {
    return <div className="rounded-xl bg-surface-container-lowest ring-1 ring-outline-variant/40 shadow-[0_18px_40px_-28px_rgba(48,48,48,0.35)] h-64 animate-pulse" aria-busy="true" />
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No orders yet"
        message="When you order while signed in, it will appear here so you can follow its delivery."
        action={<Link to="/shop" className="btn-gradient inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-label-md">Shop flowers</Link>}
      />
    )
  }

  const active = orders.filter((o) => ACTIVE.includes(o.status))
  const past = orders.filter((o) => !ACTIVE.includes(o.status))

  return (
    <div className="space-y-10">
      {[
        { title: 'In progress', list: active },
        { title: 'Past orders', list: past },
      ]
        .filter((g) => g.list.length > 0)
        .map((group) => (
          <section key={group.title} className="space-y-4">
            <h2 className="font-display text-headline-sm text-on-surface">{group.title}</h2>
            <ul className="rounded-xl bg-surface-container-lowest ring-1 ring-outline-variant/40 shadow-[0_18px_40px_-28px_rgba(48,48,48,0.35)] overflow-hidden divide-y divide-outline-variant/40">
              {group.list.map((o) => (
                <li key={o.id}>
                  <Link to={`/account/orders/${o.orderNumber}`} className="flex items-center gap-4 p-5 hover:bg-surface-container-low transition-colors">
                    {(o.items ?? [])[0]?.imageUrl && <img src={sizedImage((o.items ?? [])[0].imageUrl!, 200)} alt="" className="w-14 h-16 rounded-lg object-cover bg-surface-container shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-title-md text-on-surface">{o.orderNumber}</span>
                        <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${ORDER_STATUS_STYLE[o.status]}`}>{ORDER_STATUS_LABEL[o.status]}</span>
                      </div>
                      <p className="text-body-sm text-on-surface truncate">{o.itemsSummary}</p>
                      <p className="text-body-sm text-on-surface-variant">
                        For {o.recipientName} · {formatLongDate(o.deliveryDate)} · placed {formatPlacedAt(o.createdAt ?? o.placedAt)}
                      </p>
                    </div>
                    <span className="text-currency-md text-tertiary whitespace-nowrap">{formatLKR(o.total)}</span>
                    <ChevronRight size={18} className="text-outline shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
    </div>
  )
}
