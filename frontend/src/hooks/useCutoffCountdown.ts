import { useEffect, useState } from 'react'

/** Minutes left until today's same-day cut-off ("HH:MM"), or null once it has passed. */
export function useCutoffCountdown(cutoff: string) {
  const [left, setLeft] = useState<number | null>(null)

  useEffect(() => {
    function update() {
      const [h, m] = cutoff.split(':').map(Number)
      const target = new Date()
      target.setHours(h, m || 0, 0, 0)
      const diff = target.getTime() - Date.now()
      setLeft(diff > 0 ? Math.ceil(diff / 60_000) : null)
    }
    update()
    const id = setInterval(update, 30_000)
    return () => clearInterval(id)
  }, [cutoff])

  return left
}
