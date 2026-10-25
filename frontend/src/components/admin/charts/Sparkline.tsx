import { useWidth } from './chartUtils'

// A tiny trend line for a KPI card: one 2px line with a soft fill, no axes. The card's number and
// change text carry the meaning; the line only shows the shape of the period.
export default function Sparkline({ values, height = 36, label }: { values: number[]; height?: number; label: string }) {
  const [box, width] = useWidth<HTMLDivElement>()
  const max = Math.max(1, ...values)
  const x = (i: number) => (values.length <= 1 ? width / 2 : (i / (values.length - 1)) * width)
  const y = (v: number) => 2 + (height - 4) * (1 - v / max)
  const line = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')
  const area = `${line}L${x(values.length - 1)},${height}L${x(0)},${height}Z`

  return (
    <div ref={box} style={{ height }}>
      {width > 0 && values.length > 0 && (
        <svg width={width} height={height} role="img" aria-label={label}>
          <path d={area} fill="var(--chart-1)" fillOpacity={0.1} />
          <path d={line} fill="none" stroke="var(--chart-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={x(values.length - 1)} cy={y(values[values.length - 1]!)} r={3} fill="var(--chart-1)" stroke="var(--color-surface-container-lowest)" strokeWidth={2} />
        </svg>
      )}
    </div>
  )
}
