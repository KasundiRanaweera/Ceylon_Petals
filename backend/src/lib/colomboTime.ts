// Delivery rules ("order before 2 PM for same-day") are about Sri Lankan time, not the time on
// whatever computer the API runs on. Hosting platforms run in UTC, which is 5.5 hours behind,
// so everything date-related goes through these helpers.

const COLOMBO = 'Asia/Colombo'

const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: COLOMBO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

export interface ColomboNow {
  /** Today's date in Colombo, YYYY-MM-DD. */
  date: string
  /** Minutes since midnight in Colombo, 0 to 1439. */
  minutes: number
}

export function colomboNow(now: Date = new Date()): ColomboNow {
  const parts = formatter.formatToParts(now)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00'
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  }
}

/** Adds days to a YYYY-MM-DD date. */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** "14:00" -> 840 */
export function clockToMinutes(hhmm: string): number {
  const [h = '0', m = '0'] = hhmm.split(':')
  return Number(h) * 60 + Number(m)
}

/** YYYY-MM-DD -> a Date at midnight UTC, which is how Postgres DATE columns are read and written. */
export function dateOnly(date: string): Date {
  return new Date(`${date}T00:00:00Z`)
}
