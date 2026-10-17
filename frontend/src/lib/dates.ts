// Small date helpers. Dates are stored as 'YYYY-MM-DD' strings so they sort and compare easily.

function pad(n: number) {
  return String(n).padStart(2, '0')
}

// The shop runs on Colombo time (UTC+5:30, no daylight saving), whatever the visitor's own clock says.
// "Today" for delivery dates, order lists and reports always means today in Colombo, which is also
// what the server uses to accept or refuse a delivery date.
const colomboClock = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Colombo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

function colomboParts(at: Date) {
  const get = (type: string) => Number(colomboClock.formatToParts(at).find((p) => p.type === type)?.value)
  return { year: get('year'), month: get('month'), day: get('day'), minutes: get('hour') * 60 + get('minute') }
}

/** Minutes since midnight in Colombo. */
export function colomboMinutes(at: Date = new Date()): number {
  return colomboParts(at).minutes
}

/** Colombo's 'YYYY-MM-DD' for today (offset 0), tomorrow (1), yesterday (-1)... */
export function isoDate(offsetDays = 0, now: Date = new Date()): string {
  const { year, month, day } = colomboParts(now)
  const d = new Date(Date.UTC(year, month - 1, day + offsetDays))
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
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

/** The Colombo 'YYYY-MM-DD' of an ISO timestamp (the day an order was placed, as the shop sees it). */
export function localDay(isoTimestamp?: string): string {
  const ts = isoTimestamp ?? ''
  if (!ts) return isoDate(0)
  const { year, month, day } = colomboParts(new Date(ts))
  return `${year}-${pad(month)}-${pad(day)}`
}

/** "14:00" → "2 PM", "14:30" → "2:30 PM". */
export function formatClock(hhmm: string): string {
  const [h, m = 0] = hhmm.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return m ? `${hour}:${pad(m)} ${suffix}` : `${hour} ${suffix}`
}
