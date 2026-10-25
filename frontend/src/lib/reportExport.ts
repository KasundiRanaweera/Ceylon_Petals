import type { AdminOrder, DateRange } from '../types/admin'
import type { Product } from '../types'
import { dailySales, isSale, ordersInRange, salesByDistrict, topProducts } from './orderStats'
import { ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL } from './orderStatus'
import { SLOT_LABEL } from './deliverySlots'
import { formatPhone } from './phone'
import { isoDate } from './dates'
import { downloadCsv, downloadXlsx, type Cell, type Sheet } from './spreadsheet'

// The owner's report downloads: the orders of the chosen period as CSV, or a workbook with a summary,
// the orders, sales per day, best sellers, delivery areas and stock.

export const RANGE_INFO: Record<DateRange, { label: string; days: number; previous: string; file: string }> = {
  today: { label: 'Today', days: 1, previous: 'yesterday', file: 'today' },
  week: { label: 'Last 7 days', days: 7, previous: 'the 7 days before', file: 'last-7-days' },
  month: { label: 'Last 30 days', days: 30, previous: 'the 30 days before', file: 'last-30-days' },
}

const placed = (o: AdminOrder) => {
  const at = o.createdAt ?? o.placedAt
  if (!at) return ''
  const d = new Date(at)
  if (Number.isNaN(d.getTime())) return at
  // 2026-10-25 14:05, in Colombo time: sorts correctly and Excel reads it as a date
  return new Intl.DateTimeFormat('sv-SE', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Colombo' }).format(d)
}

function ordersSheet(orders: AdminOrder[]): Sheet {
  return {
    name: 'Orders',
    columns: [
      { header: 'Order', width: 12 },
      { header: 'Placed', width: 17 },
      { header: 'Customer', width: 22 },
      { header: 'Phone', width: 16 },
      { header: 'Email', width: 26 },
      { header: 'Recipient', width: 22 },
      { header: 'Area', width: 16 },
      { header: 'District', width: 14 },
      { header: 'Delivery date', width: 13 },
      { header: 'Delivery slot', width: 18 },
      { header: 'Items', width: 40 },
      { header: 'Subtotal', width: 12, format: 'money' },
      { header: 'Delivery fee', width: 12, format: 'money' },
      { header: 'Discount', width: 11, format: 'money' },
      { header: 'Total', width: 12, format: 'money' },
      { header: 'Payment method', width: 18 },
      { header: 'Payment status', width: 15 },
      { header: 'Order status', width: 17 },
      { header: 'Counted as sale', width: 14 },
    ],
    rows: orders.map((o) => [
      o.orderNumber,
      placed(o),
      o.customerName,
      formatPhone(o.customerPhone),
      o.customerEmail ?? '',
      o.recipientName,
      o.area,
      o.district ?? '',
      o.deliveryDate,
      SLOT_LABEL[o.deliverySlot],
      o.items?.length ? o.items.map((i) => `${i.quantity} × ${i.name}`).join('; ') : o.itemsSummary,
      o.subtotal ?? null,
      o.deliveryFee ?? null,
      o.discount ?? null,
      o.total,
      PAYMENT_METHOD_LABEL[o.paymentMethod],
      PAYMENT_STATUS_LABEL[o.paymentStatus],
      ORDER_STATUS_LABEL[o.status],
      isSale(o) ? 'Yes' : 'No',
    ]),
  }
}

function buildSheets(all: AdminOrder[], products: Product[], range: DateRange): Sheet[] {
  const info = RANGE_INFO[range]
  const orders = ordersInRange(all, range)
  const before = ordersInRange(all, range, 1)
  const sales = orders.filter(isSale)
  const salesBefore = before.filter(isSale)
  const sum = (list: AdminOrder[]) => list.reduce((s, o) => s + o.total, 0)
  const avg = (list: AdminOrder[]) => (list.length ? Math.round(sum(list) / list.length) : 0)
  const toCollect = (list: AdminOrder[]) => sum(list.filter((o) => isSale(o) && o.paymentStatus === 'PENDING' && o.paymentMethod !== 'CARD'))
  const cancelRate = (list: AdminOrder[]) => (list.length ? (list.length - list.filter(isSale).length) / list.length : 0)
  const change = (now: number, was: number): Cell => (was > 0 ? { value: (now - was) / was, format: 'pct' } : '')
  const money = (value: number): Cell => ({ value, format: 'money' })
  const row = (label: string, now: number, was: number, fmt: (n: number) => Cell = (n) => n): Cell[] => [label, fmt(now), fmt(was), change(now, was)]

  const chartDays = Math.max(info.days, 7)
  const daily = dailySales(all, chartDays)
  const dailyBefore = dailySales(all, chartDays, 1)

  return [
    {
      name: 'Summary',
      columns: [
        { header: `Measure (${info.label}, exported ${isoDate(0)})`, width: 40 },
        { header: 'This period', width: 16 },
        { header: `Previous (${info.previous})`, width: 22 },
        { header: 'Change', width: 10 },
      ],
      rows: [
        row('Sales (cancelled and failed not counted)', sum(sales), sum(salesBefore), money),
        row('Orders counted as sales', sales.length, salesBefore.length),
        row('Average order', avg(sales), avg(salesBefore), money),
        row('Still to collect (cash / WhatsApp, not marked paid)', toCollect(orders), toCollect(before), money),
        row('All orders placed', orders.length, before.length),
        ['Cancelled or failed share', { value: cancelRate(orders), format: 'pct' }, { value: cancelRate(before), format: 'pct' }, ''],
      ],
    },
    ordersSheet(orders),
    {
      name: 'Sales per day',
      columns: [
        { header: 'Day', width: 16 },
        { header: 'Orders', width: 10 },
        { header: 'Sales', width: 14, format: 'money' },
        { header: 'Same day, period before', width: 22, format: 'money' },
      ],
      rows: daily.map((d, i) => [d.date, d.orders, d.value, dailyBefore[i]?.value ?? 0]),
    },
    {
      name: 'Best sellers',
      columns: [
        { header: 'Product', width: 36 },
        { header: 'Quantity sold', width: 14 },
        { header: 'Sales', width: 14, format: 'money' },
      ],
      rows: topProducts(orders, 50).map((p) => [p.name, p.quantity, p.revenue]),
    },
    {
      name: 'Delivery areas',
      columns: [
        { header: 'Area', width: 24 },
        { header: 'Orders', width: 10 },
        { header: 'Sales', width: 14, format: 'money' },
      ],
      rows: salesByDistrict(orders).map((d) => [d.district, d.orders, d.sales]),
    },
    {
      name: 'Stock',
      columns: [
        { header: 'Product', width: 36 },
        { header: 'In the shop', width: 12 },
        { header: 'In stock', width: 10 },
        { header: 'Low-stock level', width: 15 },
        { header: 'Price', width: 12, format: 'money' },
        { header: 'Status', width: 12 },
      ],
      rows: [...products]
        .sort((a, b) => a.stock - b.stock)
        .map((p) => [p.name, p.isActive ? 'Yes' : 'Hidden', p.stock, p.lowStockThreshold, p.discountPrice ?? p.price, p.stock === 0 ? 'Sold out' : p.stock <= p.lowStockThreshold ? 'Low' : 'OK']),
    },
  ]
}

const fileName = (range: DateRange, ext: string) => `ceylon-petals-report-${RANGE_INFO[range].file}-${isoDate(0)}.${ext}`

export function exportOrdersCsv(all: AdminOrder[], range: DateRange) {
  downloadCsv(ordersSheet(ordersInRange(all, range)), fileName(range, 'csv').replace('report', 'orders'))
}

export function exportReportXlsx(all: AdminOrder[], products: Product[], range: DateRange) {
  downloadXlsx(buildSheets(all, products, range), fileName(range, 'xlsx'))
}
