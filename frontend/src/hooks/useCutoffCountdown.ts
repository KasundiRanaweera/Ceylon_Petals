import { useEffect, useState } from 'react'

// The shop works on Colombo time (UTC+5:30, no daylight saving), whatever the visitor's clock says.
const colomboClock = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Colombo',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

function secondsNowInColombo(): number {
  const parts = colomboClock.formatToParts(new Date())
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0)
  return get('hour') * 3600 + get('minute') * 60 + get('second')
}

/** Minutes left until today's same-day cut-off ("HH:MM", Colombo time), or null once it has passed. */
function minutesLeft(cutoff: string): number | null {
  const [h, m] = cutoff.split(':').map(Number)
  const diff = h * 3600 + (m || 0) * 60 - secondsNowInColombo()
  return diff > 0 ? Math.ceil(diff / 60) : null
}

export function useCutoffCountdown(cutoff: string) {
  // Worked out on the first render too, so the page never flashes the wrong message.
  const [left, setLeft] = useState<number | null>(() => minutesLeft(cutoff))

  useEffect(() => {
    const update = () => setLeft(minutesLeft(cutoff))
    update()
    const id = setInterval(update, 30_000)
    return () => clearInterval(id)
  }, [cutoff])

  return left
}
