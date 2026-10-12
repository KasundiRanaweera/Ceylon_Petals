import { Search, LayoutGrid, List } from 'lucide-react'
import type { OrderStatus } from '../../../types/admin'
import { ORDER_STATUSES, ORDER_STATUS_LABEL } from '../../../lib/orderStatus'
import type { DateFilter, OrderFilters, OrdersView, PaymentFilter } from './orderFilters'

const DATE_OPTIONS: { id: DateFilter; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'all', label: 'All Dates' },
]

const PAYMENT_OPTIONS: { id: PaymentFilter; label: string }[] = [
  { id: 'ALL', label: 'All payments' },
  { id: 'PAID', label: 'Paid' },
  { id: 'PENDING', label: 'Unpaid' },
  { id: 'FAILED', label: 'Failed' },
  { id: 'REFUNDED', label: 'Refunded' },
]

interface OrdersToolbarProps {
  filters: OrderFilters
  onFiltersChange: (changes: Partial<OrderFilters>) => void
  counts: Record<string, number>
  view: OrdersView
  onViewChange: (view: OrdersView) => void
}

export default function OrdersToolbar({ filters, onFiltersChange, counts, view, onViewChange }: OrdersToolbarProps) {
  const statusTabs: { id: 'ALL' | OrderStatus; label: string }[] = [
    { id: 'ALL', label: 'All' },
    ...ORDER_STATUSES.map((s) => ({ id: s, label: ORDER_STATUS_LABEL[s] })),
  ]

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm p-4 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative w-full lg:max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input
            value={filters.query}
            onChange={(e) => onFiltersChange({ query: e.target.value })}
            placeholder="Search by order, customer, recipient or area..."
            aria-label="Search orders"
            className="w-full bg-surface-container-low rounded-lg py-2 pl-9 pr-3 text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center bg-surface-container rounded-lg p-0.5" role="tablist" aria-label="Delivery date">
            {DATE_OPTIONS.map((d) => (
              <button
                key={d.id}
                type="button"
                role="tab"
                aria-selected={filters.date === d.id}
                onClick={() => onFiltersChange({ date: d.id })}
                className={`px-3 py-1 rounded text-label-md transition-all ${
                  filters.date === d.id ? 'bg-surface-container-lowest text-primary font-bold shadow-sm' : 'text-secondary hover:text-on-surface'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <select
            value={filters.payment}
            onChange={(e) => onFiltersChange({ payment: e.target.value as PaymentFilter })}
            aria-label="Filter by payment status"
            className="bg-surface-container-low text-on-surface text-label-md rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            {PAYMENT_OPTIONS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>

          <div className="flex items-center bg-surface-container rounded-lg p-0.5" role="tablist" aria-label="View">
            <button
              type="button"
              role="tab"
              aria-selected={view === 'board'}
              onClick={() => onViewChange('board')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-label-md transition-all ${
                view === 'board' ? 'bg-surface-container-lowest text-primary font-bold shadow-sm' : 'text-secondary hover:text-on-surface'
              }`}
            >
              <LayoutGrid size={14} /> Board
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'table'}
              onClick={() => onViewChange('table')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-label-md transition-all ${
                view === 'table' ? 'bg-surface-container-lowest text-primary font-bold shadow-sm' : 'text-secondary hover:text-on-surface'
              }`}
            >
              <List size={14} /> Table
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {statusTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onFiltersChange({ status: t.id })}
            className={`px-3 py-1 rounded-sm text-label-md whitespace-nowrap transition-colors ${
              filters.status === t.id
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            {t.label} ({counts[t.id] ?? 0})
          </button>
        ))}
      </div>
    </div>
  )
}