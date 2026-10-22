import { useState } from 'react'

export interface ShareSlice {
  key: string
  label: string
  value: number
  valueText: string
}

// SLOTS follows the fixed categorical order (rose, gold, blue); a slice keeps its colour by its
// position in the list it was given, never by its rank, so the colours don't move between periods.
const SLOTS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)']

// Parts of a whole in one bar (how customers pay): a 2px surface gap between parts, and a legend
// with the label, share and amount, so colour is never the only way to tell them apart.
export default function ShareBar({ slices }: { slices: ShareSlice[] }) {
  const [hover, setHover] = useState<string | null>(null)
  const total = slices.reduce((s, x) => s + x.value, 0)
  const pct = (v: number) => (total ? Math.round((v / total) * 100) : 0)

  return (
    <div className="space-y-4">
      <div className="flex h-3 gap-[2px] overflow-hidden rounded-full bg-surface-container" role="img" aria-label={slices.map((s) => `${s.label} ${pct(s.value)}%`).join(', ')}>
        {total > 0 &&
          slices.map((s, i) =>
            s.value > 0 ? (
              <div
                key={s.key}
                className="h-full transition-opacity"
                style={{ width: `${(s.value / total) * 100}%`, background: SLOTS[i % SLOTS.length], opacity: hover && hover !== s.key ? 0.4 : 1 }}
                onMouseEnter={() => setHover(s.key)}
                onMouseLeave={() => setHover(null)}
                title={`${s.label}: ${pct(s.value)}% · ${s.valueText}`}
              />
            ) : null,
          )}
      </div>
      <ul className="space-y-2">
        {slices.map((s, i) => (
          <li key={s.key} className="flex items-center gap-2.5 text-body-sm" onMouseEnter={() => setHover(s.key)} onMouseLeave={() => setHover(null)}>
            <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: SLOTS[i % SLOTS.length] }} />
            <span className="flex-1 text-on-surface">{s.label}</span>
            <span className="tabular-nums font-semibold text-on-surface">{pct(s.value)}%</span>
            <span className="w-28 text-right tabular-nums text-secondary">{s.valueText}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
