import { ordersByDay } from '../../../lib/orderStats'
import { formatLKR } from '../../../lib/format'
import type { AdminOrder } from '../../../types/admin'

export default function OrdersThisWeekChart({ orders }: { orders: AdminOrder[] }) {
  const days = ordersByDay(orders, 7)
  const max = Math.max(1, ...days.map((d) => d.orders ?? 0))
  const peak = days.find((d) => (d.orders ?? 0) === max && (d.orders ?? 0) > 0)

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm p-4 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-headline-sm text-primary">Orders, last 7 days</h3>
        {peak && <span className="text-[11px] text-secondary">Busiest: {peak.day}</span>}
      </div>

      <div className="h-32 flex items-end gap-2" role="img" aria-label={`Orders per day: ${days.map((d) => `${d.day} ${d.orders ?? 0}`).join(', ')}`}>
        {days.map((d, i) => {
          const isPeak = d === peak
          return (
            <div key={`${d.day}-${i}`} className="flex-1 h-full flex items-end">
              <div
                className={`relative w-full rounded-t transition-all ${isPeak ? 'bg-primary' : 'bg-primary-fixed-dim'}`}
                style={{ height: `${Math.max(2, ((d.orders ?? 0) / max) * 100)}%` }}
                title={`${d.day}: ${d.orders} orders, ${formatLKR(d.sales ?? 0)}`}
              >
                {isPeak && (
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] bg-primary text-on-primary px-1.5 py-0.5 rounded whitespace-nowrap">
                    {d.orders ?? 0}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex gap-2">
        {days.map((d, i) => (
          <span key={`${d.day}-${i}`} className="flex-1 text-center text-[11px] text-secondary">{d.day}</span>
        ))}
      </div>
    </div>
  )
}
