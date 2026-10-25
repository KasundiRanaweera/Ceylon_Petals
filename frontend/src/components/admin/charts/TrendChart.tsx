import { useState } from 'react'
import { Table2, LineChart } from 'lucide-react'
import { compactLKR, labelIndexes, niceTicks, useWidth } from './chartUtils'
import { formatLKR } from '../../../lib/format'

export interface TrendPoint {
  label: string
  /** the full date, for the tooltip and the table */
  date: string
  value: number
  orders: number
}

interface TrendChartProps {
  title: string
  points: TrendPoint[]
  /** the same measure for the period before, one value per point (drawn as a dashed line) */
  previous?: number[]
  previousLabel?: string
  height?: number
}

const PAD = { top: 12, right: 12, bottom: 28, left: 56 }

// Sales over time: a 2px line with a soft area under it, the previous period as a dashed grey line
// for comparison, a crosshair and tooltip on hover, and a table view of the same numbers.
export default function TrendChart({ title, points, previous, previousLabel = 'Previous period', height = 240 }: TrendChartProps) {
  const [box, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const [asTable, setAsTable] = useState(false)

  const max = Math.max(1, ...points.map((p) => p.value), ...(previous ?? []))
  const ticks = niceTicks(max)
  const top = ticks[ticks.length - 1]!
  const innerW = Math.max(0, width - PAD.left - PAD.right)
  const innerH = height - PAD.top - PAD.bottom
  const x = (i: number) => PAD.left + (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW)
  const y = (v: number) => PAD.top + innerH - (v / top) * innerH
  const line = (vals: number[]) => vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')
  const current = points.map((p) => p.value)
  const area = `${line(current)}L${x(points.length - 1)},${y(0)}L${x(0)},${y(0)}Z`
  const shown = labelIndexes(points.length, innerW)
  const total = current.reduce((a, b) => a + b, 0)
  const h = hover !== null ? points[hover] : undefined

  return (
    <section className="rounded-xl bg-surface-container-lowest p-5 shadow-sm ring-1 ring-outline-variant/30">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-headline-sm text-primary">{title}</h2>
          {previous && (
            <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-secondary" aria-label="Legend">
              <li className="flex items-center gap-1.5"><span aria-hidden="true" className="h-0.5 w-4 rounded bg-[var(--chart-1)]" />This period</li>
              <li className="flex items-center gap-1.5"><span aria-hidden="true" className="w-4 border-t-2 border-dashed border-[var(--chart-compare)]" />{previousLabel}</li>
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={() => setAsTable((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container px-2.5 py-1 text-[12px] text-secondary hover:text-on-surface"
          aria-pressed={asTable}
        >
          {asTable ? <LineChart size={14} /> : <Table2 size={14} />} {asTable ? 'Chart' : 'Table'}
        </button>
      </div>

      {asTable ? (
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-left text-body-sm">
            <thead className="sticky top-0 bg-surface-container-lowest text-[11px] uppercase tracking-wider text-secondary">
              <tr><th className="py-2 font-semibold">Day</th><th className="py-2 text-right font-semibold">Orders</th><th className="py-2 text-right font-semibold">Sales</th>{previous && <th className="py-2 text-right font-semibold">{previousLabel}</th>}</tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {points.map((p, i) => (
                <tr key={p.date}><td className="py-1.5">{p.date}</td><td className="py-1.5 text-right">{p.orders}</td><td className="py-1.5 text-right text-on-surface">{formatLKR(p.value)}</td>{previous && <td className="py-1.5 text-right text-secondary">{formatLKR(previous[i] ?? 0)}</td>}</tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div ref={box} className="relative" style={{ height }}>
          {width > 0 && (
            <svg width={width} height={height} role="img" aria-label={`${title}: ${formatLKR(total)} in total over ${points.length} days`} onMouseLeave={() => setHover(null)}>
              {ticks.map((t) => (
                <g key={t}>
                  <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--chart-grid)" />
                  <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-[var(--color-secondary)] text-[11px] tabular-nums">{compactLKR(t)}</text>
                </g>
              ))}
              {shown.map((i) => (
                <text key={i} x={x(i)} y={height - 8} textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'} className="fill-[var(--color-secondary)] text-[11px]">{points[i]!.label}</text>
              ))}
              <path d={area} fill="var(--chart-1)" fillOpacity={0.12} />
              {previous && <path d={line(previous)} fill="none" stroke="var(--chart-compare)" strokeWidth={1.5} strokeDasharray="4 4" strokeLinejoin="round" />}
              <path d={line(current)} fill="none" stroke="var(--chart-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              {hover !== null && (
                <>
                  <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={y(0)} stroke="var(--color-outline)" strokeOpacity={0.5} />
                  {previous && <circle cx={x(hover)} cy={y(previous[hover] ?? 0)} r={4} fill="var(--chart-compare)" stroke="var(--color-surface-container-lowest)" strokeWidth={2} />}
                  <circle cx={x(hover)} cy={y(current[hover]!)} r={5} fill="var(--chart-1)" stroke="var(--color-surface-container-lowest)" strokeWidth={2} />
                </>
              )}
              {/* hit areas wider than the marks: one column per day */}
              {points.map((p, i) => (
                <rect key={p.date} x={x(i) - innerW / Math.max(1, points.length - 1) / 2} y={PAD.top} width={Math.max(8, innerW / Math.max(1, points.length - 1))} height={innerH} fill="transparent" onMouseEnter={() => setHover(i)} />
              ))}
            </svg>
          )}
          {h && hover !== null && (
            <div
              className="pointer-events-none absolute z-10 w-max rounded-lg bg-inverse-surface px-3 py-2 text-[12px] text-inverse-on-surface shadow-lg"
              style={{ left: Math.min(Math.max(x(hover), 90), width - 90), top: 0, transform: 'translateX(-50%)' }}
            >
              <div className="font-semibold">{h.date}</div>
              <div>Sales {formatLKR(h.value)} · {h.orders} {h.orders === 1 ? 'order' : 'orders'}</div>
              {previous && <div className="opacity-75">{previousLabel}: {formatLKR(previous[hover] ?? 0)}</div>}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
