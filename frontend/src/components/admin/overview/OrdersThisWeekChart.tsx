import ColumnChart from '../charts/ColumnChart'
import { dailySales } from '../../../lib/orderStats'
import type { AdminOrder } from '../../../types/admin'

export default function OrdersThisWeekChart({ orders }: { orders: AdminOrder[] }) {
  const days = dailySales(orders, 7)
  const total = days.reduce((s, d) => s + d.orders, 0)
  const peak = days.reduce((best, d) => (d.orders > best.orders ? d : best), days[0]!)

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm p-4">
      <div className="mb-3">
        <h3 className="font-display text-headline-sm text-primary">Orders, last 7 days</h3>
        <p className="mt-0.5 text-[12px] text-secondary">
          {total} in total{peak.orders > 0 && ` · busiest ${peak.date} (${peak.orders})`}
        </p>
      </div>
      <ColumnChart
        columns={days.map((d) => ({ label: d.label, detail: d.date, value: d.orders }))}
        describe={(n) => `${n} ${n === 1 ? 'order' : 'orders'}`}
        height={150}
        ariaLabel={`Orders per day: ${days.map((d) => `${d.date} ${d.orders}`).join(', ')}`}
      />
    </div>
  )
}
