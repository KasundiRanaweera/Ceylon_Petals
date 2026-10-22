import type { ReactNode } from 'react'

export interface BarRow {
  key: string
  label: ReactNode
  value: number
  /** the number printed at the end of the row (e.g. "Rs. 45,000 · 3 sold") */
  valueText: string
  /** extra words under the label */
  hint?: string
}

// A ranked list with a horizontal bar per row: the label and value in text colours, the bar in one
// hue so length is the only thing that changes. Bars share one scale (the largest row is full width).
export default function BarList({ rows, empty = 'Nothing in this period.' }: { rows: BarRow[]; empty?: string }) {
  if (rows.length === 0) return <p className="text-body-sm text-secondary">{empty}</p>
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.key} className="group" title={`${typeof r.label === 'string' ? r.label : ''} ${r.valueText}`.trim()}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-body-sm">
            <span className="min-w-0 truncate text-on-surface">
              {r.label}
              {r.hint && <span className="ml-1.5 text-secondary">{r.hint}</span>}
            </span>
            <span className="shrink-0 tabular-nums text-secondary">{r.valueText}</span>
          </div>
          <div className="h-2 rounded-full bg-surface-container">
            <div className="h-full rounded-full bg-[var(--chart-1)] transition-opacity group-hover:opacity-80" style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
