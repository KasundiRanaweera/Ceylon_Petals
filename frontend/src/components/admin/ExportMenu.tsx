import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Download, FileSpreadsheet, FileText } from 'lucide-react'
import { exportOrdersCsv, exportReportXlsx } from '../../lib/reportExport'
import { rangeText, type Period } from '../../lib/period'
import { useToast } from '../../hooks/useToast'
import type { AdminOrder } from '../../types/admin'
import type { Product } from '../../types'

// "Download" button for the owner pages: the period's orders as CSV, or the full report as Excel.
export default function ExportMenu({ orders, products, period, disabled = false }: { orders: AdminOrder[]; products: Product[]; period: Period; disabled?: boolean }) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const { showToast } = useToast()

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !box.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  const run = (fn: () => void, what: string) => {
    setOpen(false)
    try {
      fn()
      showToast(`${what} downloaded`, 'success')
    } catch {
      showToast(`Could not create the ${what.toLowerCase()}. Please try again.`, 'error')
    }
  }

  const items = [
    { icon: FileText, label: 'Orders as CSV', hint: 'One row per order', go: () => run(() => exportOrdersCsv(orders, period), 'CSV file') },
    { icon: FileSpreadsheet, label: 'Full report as Excel', hint: 'Summary, orders, sales per day, best sellers, areas, stock', go: () => run(() => exportReportXlsx(orders, products, period), 'Excel report') },
  ]

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[38px] cursor-pointer items-center gap-2 rounded-lg bg-surface-container-lowest px-3.5 py-2 text-label-md text-on-surface shadow-sm ring-1 ring-outline-variant/50 transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Download size={16} aria-hidden="true" />
        Download
        <ChevronDown size={15} aria-hidden="true" className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-30 mt-2 w-72 overflow-hidden rounded-xl bg-surface-container-lowest p-1.5 shadow-lg ring-1 ring-outline-variant/50">
          <p className="px-3 pb-1.5 pt-1 text-[11px] uppercase tracking-wider text-secondary">{rangeText(period)}</p>
          {items.map(({ icon: Icon, label, hint, go }) => (
            <button
              key={label}
              type="button"
              role="menuitem"
              onClick={go}
              className="flex w-full cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-container-low focus-visible:bg-surface-container-low focus-visible:outline-none"
            >
              <Icon size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-primary" />
              <span>
                <span className="block text-body-sm font-semibold text-on-surface">{label}</span>
                <span className="block text-[12px] text-secondary">{hint}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
