import { isoDate } from './dates'

// The reporting period the owner picks on the Overview and Analytics pages: a preset (today, last 7
// days...) or any custom from–to range. Days are Colombo 'YYYY-MM-DD' strings, both ends included.
// Every period is compared with the same number of days just before it.

export type PresetId = 'today' | 'week' | 'month' | 'quarter' | 'thisMonth' | 'lastMonth' | 'custom'

export interface Period {
  preset: PresetId
  from: string
  to: string
}

/** Longest custom range, so the day-by-day charts stay readable. */
export const MAX_DAYS = 366

export const PRESETS: { id: Exclude<PresetId, 'custom'>; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Last 7 days' },
  { id: 'month', label: 'Last 30 days' },
  { id: 'quarter', label: 'Last 90 days' },
  { id: 'thisMonth', label: 'This month' },
  { id: 'lastMonth', label: 'Last month' },
]

const pad = (n: number) => String(n).padStart(2, '0')

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number)
  const t = new Date(Date.UTC(y!, m! - 1, d! + n))
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`
}

/** Number of days in the period, both ends included. */
export function periodDays(p: { from: string; to: string }): number {
  return Math.round((Date.parse(`${p.to}T00:00:00Z`) - Date.parse(`${p.from}T00:00:00Z`)) / 86_400_000) + 1
}

export function presetPeriod(id: Exclude<PresetId, 'custom'>): Period {
  const today = isoDate(0)
  const back = (days: number) => ({ preset: id, from: addDays(today, -(days - 1)), to: today })
  switch (id) {
    case 'today':
      return back(1)
    case 'week':
      return back(7)
    case 'month':
      return back(30)
    case 'quarter':
      return back(90)
    case 'thisMonth':
      return { preset: id, from: `${today.slice(0, 8)}01`, to: today }
    case 'lastMonth': {
      const end = addDays(`${today.slice(0, 8)}01`, -1)
      return { preset: id, from: `${end.slice(0, 8)}01`, to: end }
    }
  }
}

export function customPeriod(from: string, to: string): Period {
  return from <= to ? { preset: 'custom', from, to } : { preset: 'custom', from: to, to: from }
}

/** The same number of days immediately before. */
export function previousPeriod(p: Period): Period {
  const days = periodDays(p)
  return { preset: 'custom', from: addDays(p.from, -days), to: addDays(p.from, -1) }
}

const short = (day: string, withYear = false) =>
  new Date(`${day}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) })

/** "3 Oct – 18 Oct 2026", or "25 Oct 2026" for a single day. */
export function rangeText(p: { from: string; to: string }): string {
  if (p.from === p.to) return short(p.from, true)
  return `${short(p.from, p.from.slice(0, 4) !== p.to.slice(0, 4))} – ${short(p.to, true)}`
}

/** The name shown on the picker button: the preset's name, or the dates of a custom range. */
export function periodLabel(p: Period): string {
  return PRESETS.find((x) => x.id === p.preset)?.label ?? rangeText(p)
}

/** What the period is compared with, for sentences like "Up 12% on …". */
export function comparisonLabel(p: Period): string {
  const days = periodDays(p)
  if (p.preset === 'today') return 'yesterday'
  if (days === 1) return 'the day before'
  return `the ${days} days before`
}

/**
 * The days the charts draw: the period itself, or for periods shorter than a week the 7 days ending
 * on its last day, so a single day still has some shape around it.
 */
export function chartWindow(p: Period): Period {
  return periodDays(p) >= 7 ? p : { preset: 'custom', from: addDays(p.to, -6), to: p.to }
}
