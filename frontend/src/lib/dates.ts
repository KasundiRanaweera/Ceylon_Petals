// Small date helpers. Dates are stored as 'YYYY-MM-DD' strings so they sort and compare easily.

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function isoDate(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function formatDeliveryDate(iso: string): string {
  if (iso === isoDate(0)) return 'Today'
  if (iso === isoDate(1)) return 'Tomorrow'
  if (iso === isoDate(-1)) return 'Yesterday'
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

/** "Today, 10:20 AM", "Yesterday, 5:20 PM" or "3 Oct, 9:14 AM" for an ISO timestamp. */
export function formatPlacedAt(isoTimestamp?: string): string {
  const ts = isoTimestamp ?? ''
  if (!ts) return '—'
  const d = new Date(ts)
  const time = d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })
  const day = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  if (day === isoDate(0)) return `Today, ${time}`
  if (day === isoDate(-1)) return `Yesterday, ${time}`
  return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, ${time}`
}

/** "Sat, 10 Oct 2026" for a 'YYYY-MM-DD' date. */
export function formatLongDate(iso?: string): string {
  if (!iso) return '—'
  return new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Local 'YYYY-MM-DD' for an ISO timestamp. */
export function localDay(isoTimestamp?: string): string {
  const ts = isoTimestamp ?? ''
  if (!ts) return isoDate(0)
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** "14:00" → "2 PM", "14:30" → "2:30 PM". */
export function formatClock(hhmm: string): string {
  const [h, m = 0] = hhmm.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return m ? `${hour}:${pad(m)} ${suffix}` : `${hour} ${suffix}`
}
