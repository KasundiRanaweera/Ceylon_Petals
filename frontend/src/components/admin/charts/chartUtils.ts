import { useEffect, useRef, useState } from 'react'

// Small helpers shared by the dashboard charts (plain SVG, no chart library).

/** Width of an element, kept up to date as the layout changes. */
export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const watch = new ResizeObserver(([entry]) => setWidth(Math.round(entry?.contentRect.width ?? 0)))
    watch.observe(el)
    return () => watch.disconnect()
  }, [])
  return [ref, width] as const
}

/** "Nice" round axis steps from 0 up to at least `max`, about `count` of them. */
export function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0, 1]
  const raw = max / count
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag
  const top = Math.ceil(max / step) * step
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => +(i * step).toFixed(6))
}

/** Short money labels for axes: Rs 950k, Rs 1.2M. Tooltips and tables use the full amount. */
export function compactLKR(n: number): string {
  if (n >= 1_000_000) return `Rs ${+(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `Rs ${+(n / 1_000).toFixed(n >= 100_000 ? 0 : 1)}k`
  return `Rs ${n}`
}

/** Indexes of the x labels to print, so they never crowd (always includes the first and last). */
export function labelIndexes(count: number, width: number, minGap = 64): number[] {
  if (count <= 1) return [0]
  const fit = Math.max(2, Math.floor(width / minGap))
  const every = Math.max(1, Math.ceil((count - 1) / (fit - 1)))
  const out: number[] = []
  for (let i = 0; i < count; i += every) out.push(i)
  if (out[out.length - 1] !== count - 1) {
    if (count - 1 - out[out.length - 1]! < every / 2) out.pop()
    out.push(count - 1)
  }
  return out
}
