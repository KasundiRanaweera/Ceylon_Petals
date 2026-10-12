import { useMemo, useState } from 'react'
import { Download, SearchX } from 'lucide-react'
import { useAdminOrders } from '../../hooks/useAdminData'
import { formatPlacedAt, isoDate } from '../../lib/dates'
import { ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL } from '../../lib/orderStatus'
import { SLOT_LABEL } from '../../lib/deliverySlots'
import { downloadCsv } from '../../lib/exportCsv'
import { useToast } from '../../hooks/useToast'
import { useOrderStatusFlow } from '../../components/admin/orders/useOrderStatusFlow'
import OrdersStats from '../../components/admin/orders/OrdersStats'
import OrdersToolbar from '../../components/admin/orders/OrdersToolbar'
import OrderBoard from '../../components/admin/orders/OrderBoard'
import OrdersTable from '../../components/admin/orders/OrdersTable'
import {
  DEFAULT_FILTERS,
  countByStatus,
  filterOrders,
  type OrderFilters,
  type OrdersView,
} from '../../components/admin/orders/orderFilters'

// What the owner does on this page:
//  - sees what must be prepared and when it leaves (board by delivery slot, or a table)
//  - moves each order through Pending -> Confirmed -> Preparing -> Out for Delivery -> Delivered
//  - cancels an order (with a confirmation, because it can't be undone)
//  - records payments that happen outside the website (cash on delivery, WhatsApp orders, refunds)
//  - messages the customer on WhatsApp, and exports the list as a spreadsheet
//
// Orders come from services/orders (the mock API now, GET /api/admin/orders later), so orders
// placed at checkout appear here and every change is saved.
export default function Orders() {
  const { showToast } = useToast()
  const { data, isLoading } = useAdminOrders()
  const orders = useMemo(() => data ?? [], [data])
  const { changeStatus, changePayment, cancelDialog } = useOrderStatusFlow()
  const [filters, setFilters] = useState<OrderFilters>(DEFAULT_FILTERS)
  const [view, setView] = useState<OrdersView>('board')

  function updateFilters(changes: Partial<OrderFilters>) {
    setFilters((prev) => ({ ...prev, ...changes }))
  }

  const filtered = useMemo(() => filterOrders(orders, filters), [orders, filters])
  // The status tabs show how many orders each status has *within the other active filters*.
  const counts = useMemo(() => countByStatus(filterOrders(orders, filters, { ignoreStatus: true })), [orders, filters])

  function exportOrders() {
    const header = [
      'Order', 'Placed', 'Delivery date', 'Delivery slot', 'Customer', 'Customer phone',
      'Recipient', 'Recipient phone', 'Address', 'Area', 'District', 'Items', 'Card message', 'Total (LKR)', 'Payment method', 'Payment status', 'Order status',
    ]
    const rows = filtered.map((o) => [
      o.orderNumber, formatPlacedAt(o.createdAt), o.deliveryDate, SLOT_LABEL[o.deliverySlot], o.customerName, o.customerPhone,
      o.recipientName, o.recipientPhone ?? '', o.address ?? '', o.area, o.district ?? '', o.itemsSummary, o.cardMessage ?? '', o.total, PAYMENT_METHOD_LABEL[o.paymentMethod],
      PAYMENT_STATUS_LABEL[o.paymentStatus], ORDER_STATUS_LABEL[o.status],
    ])
    downloadCsv(`orders-${isoDate(0)}.csv`, [header, ...rows])
    showToast(`Exported ${filtered.length} ${filtered.length === 1 ? 'order' : 'orders'} to a spreadsheet`)
  }

  function clearFilters() {
    setFilters({ ...DEFAULT_FILTERS })
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] text-secondary tracking-widest uppercase block mb-1">Order Management</span>
          <h1 className="font-display text-headline-lg text-primary tracking-tight">Orders</h1>
          <p className="text-body-md text-secondary mt-1">Prepare, dispatch and track every order from one place.</p>
        </div>
        <button
          type="button"
          onClick={exportOrders}
          disabled={filtered.length === 0}
          className="inline-flex items-center gap-2 bg-surface-container-high text-primary px-4 py-2 rounded-lg text-label-md hover:bg-primary hover:text-on-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={16} />
          <span>Export to Spreadsheet</span>
        </button>
      </div>

      <OrdersStats orders={orders} />

      <OrdersToolbar
        filters={filters}
        onFiltersChange={updateFilters}
        counts={counts}
        view={view}
        onViewChange={setView}
      />

      <div className="flex items-center justify-between text-body-sm text-secondary">
        <span>Showing {filtered.length} of {orders.length} orders</span>
        <button type="button" onClick={clearFilters} className="text-label-md text-primary hover:underline">
          Clear filters
        </button>
      </div>

      {isLoading ? (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm h-64 animate-pulse" aria-busy="true" />
      ) : filtered.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-12 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-surface-container flex items-center justify-center text-primary">
            <SearchX size={22} />
          </div>
          <h2 className="font-display text-headline-sm text-primary">No orders match these filters</h2>
          <p className="text-body-md text-secondary">Try a different date or status, or clear the filters to see everything.</p>
          <button type="button" onClick={clearFilters} className="text-label-md text-primary hover:underline">
            Clear filters
          </button>
        </div>
      ) : view === 'board' ? (
        <OrderBoard orders={filtered} onStatusChange={changeStatus} onPaymentChange={changePayment} />
      ) : (
        <OrdersTable orders={filtered} onStatusChange={changeStatus} onPaymentChange={changePayment} />
      )}
      {cancelDialog}
    </div>
  )
}