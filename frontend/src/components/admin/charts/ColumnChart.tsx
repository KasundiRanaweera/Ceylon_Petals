import { useState } from 'react'
import { labelIndexes, niceTicks, useWidth } from './chartUtils'

export interface Column {
  label: string
  /** shown in the tooltip, e.g. the full date */
  detail?: string
  value: number
}

interface ColumnChartProps {
  columns: Column[]
  /** how a value reads in the tooltip, e.g. 3 -> "3 orders" */
  describe: (value: number) => string
  height?: number
  /** label the tallest column directly (only that one, never every bar) */
  labelPeak?: boolean
  ariaLabel: string
}

const PAD = { top: 18, right: 4, bottom: 24, left: 32 }

// Vertical bars for counts (orders per day, per delivery slot): one hue, 4px rounded tops sitting on
// the baseline, a 2px gap between bars, light gridlines and a tooltip on hover.
export default function ColumnChart({ columns, describe, height = 180, labelPeak = true, ariaLabel }: ColumnChartProps) {
  const [box, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...columns.map((c) => c.value))
  const ticks = niceTicks(max, 3).filter((t) => Number.isInteger(t))
  const top = ticks[ticks.length - 1]!
  const innerW = Math.max(0, width - PAD.left - PAD.right)
  const innerH = height - PAD.top - PAD.bottom
  const slot = innerW / Math.max(1, columns.length)
  const barW = Math.max(2, Math.min(40, slot - 2))
  const y = (v: number) => PAD.top + innerH - (v / top) * innerH
  const peak = columns.reduce((best, c, i) => (c.value > (columns[best]?.value ?? -1) ? i : best), 0)
  const shown = new Set(labelIndexes(columns.length, innerW, 34))
  const h = hover !== null ? columns[hover] : undefined

  return (
    <div ref={box} className="relative" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={ariaLabel} onMouseLeave={() => setHover(null)}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--chart-grid)" />
              <text x={PAD.left - 6} y={y(t)} dy="0.32em" textAnchor="end" className="fill-[var(--color-secondary)] text-[11px] tabular-nums">{t}</text>
            </g>
          ))}
          {columns.map((c, i) => {
            const cx = PAD.left + slot * i + slot / 2
            const bh = Math.max(c.value > 0 ? 3 : 0, y(0) - y(c.value))
            const r = Math.min(4, barW / 2, bh)
            const x0 = cx - barW / 2
            const y0 = y(0) - bh
            // rounded top corners only; the bar stands square on the baseline
            const d = bh > 0 ? `M${x0},${y(0)}V${y0 + r}Q${x0},${y0} ${x0 + r},${y0}H${x0 + barW - r}Q${x0 + barW},${y0} ${x0 + barW},${y0 + r}V${y(0)}Z` : ''
            return (
              <g key={`${c.label}-${i}`}>
                {d && <path d={d} fill="var(--chart-1)" fillOpacity={hover === null || hover === i ? 1 : 0.45} />}
                {labelPeak && i === peak && c.value > 0 && (
                  <text x={cx} y={y0 - 5} textAnchor="middle" className="fill-[var(--color-on-surface)] text-[11px] font-semibold tabular-nums">{c.value}</text>
                )}
                {shown.has(i) && <text x={columns.length > 7 && i === columns.length - 1 ? width - PAD.right : columns.length > 7 && i === 0 ? PAD.left : cx} y={height - 6} textAnchor={columns.length > 7 && i === columns.length - 1 ? 'end' : columns.length > 7 && i === 0 ? 'start' : 'middle'} className="fill-[var(--color-secondary)] text-[11px]">{c.label}</text>}
                <rect x={PAD.left + slot * i} y={PAD.top} width={slot} height={innerH} fill="transparent" onMouseEnter={() => setHover(i)} />
              </g>
            )
          })}
          <line x1={PAD.left} x2={width - PAD.right} y1={y(0)} y2={y(0)} stroke="var(--color-outline-variant)" />
        </svg>
      )}
      {h && hover !== null && (
        <div
          className="pointer-events-none absolute z-10 w-max rounded-lg bg-inverse-surface px-3 py-1.5 text-[12px] text-inverse-on-surface shadow-lg"
          style={{ left: Math.min(Math.max(PAD.left + slot * hover + slot / 2, 70), width - 70), top: 0, transform: 'translate(-50%, -100%)' }}
        >
          <span className="font-semibold">{h.detail ?? h.label}</span> · {describe(h.value)}
        </div>
      )}
    </div>
  )
}
