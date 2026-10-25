import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import Sparkline from '../charts/Sparkline'
import { percentChange } from '../../../lib/orderStats'

// "Up 12% on the 7 days before", with an arrow and words, so the change never relies on colour alone.
// Big jumps read better as a multiple ("3.4×") than as "240%".
export function Delta({ now, before, against, lowerIsBetter = false }: { now: number; before: number; against: string; lowerIsBetter?: boolean }) {
  const pct = percentChange(now, before)
  if (pct === null) return <p className="text-[12px] text-secondary">Nothing to compare with {against}</p>
  const Icon = pct > 0 ? TrendingUp : pct < 0 ? TrendingDown : Minus
  const good = lowerIsBetter ? pct < 0 : pct > 0
  const tone = pct === 0 ? 'text-secondary' : good ? 'text-emerald-700 dark:text-emerald-400' : 'text-error'
  const size = pct >= 200 ? `${(1 + pct / 100).toFixed(1)}×` : `${Math.abs(pct)}%`
  return (
    <p className="flex flex-wrap items-center gap-x-1 text-[12px] text-secondary">
      <Icon size={14} aria-hidden="true" className={tone} />
      <span className={`font-semibold ${tone}`}>{pct > 0 ? 'Up' : pct < 0 ? 'Down' : 'No change'}{pct !== 0 && ` ${size}`}</span>
      <span>on {against}</span>
    </p>
  )
}

interface KpiCardProps {
  title: string
  icon: LucideIcon
  value: string
  /** the change line (usually a <Delta />) */
  footer: ReactNode
  /** one value per day, for the sparkline */
  trend?: number[]
  trendLabel?: string
  alert?: boolean
}

// One headline number: its name, the figure, how it moved against the period before, and a small
// line of the days behind it.
export default function KpiCard({ title, icon: Icon, value, footer, trend, trendLabel = '', alert = false }: KpiCardProps) {
  return (
    <div className="flex h-full flex-col gap-3 rounded-xl bg-surface-container-lowest p-5 shadow-sm ring-1 ring-outline-variant/30">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary">{title}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${alert ? 'bg-error-container text-error' : 'bg-surface-container text-primary'}`}>
          <Icon size={17} aria-hidden="true" />
        </span>
      </div>
      <div className="text-[1.75rem] font-semibold leading-none tracking-tight text-primary">{value}</div>
      {trend && <Sparkline values={trend} label={trendLabel} />}
      <div className="mt-auto">{footer}</div>
    </div>
  )
}
