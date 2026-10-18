import { useEffect, useRef } from 'react'
import { useMotionValueEvent, type MotionValue } from 'motion/react'

// A flower drawn in SVG that opens from a closed bud (progress 0) to full bloom (progress 1).
//
// Real flowers open from the outside in, so each ring has its own window of the scroll: the sepals
// part first, then the outer, middle and inner petals, and the centre and stamens appear last.
// Every frame only updates `transform` / `opacity` attributes on refs (no React re-render), which
// keeps it smooth even on phones.

type Ring = {
  count: number
  length: number
  width: number
  /** Part of the overall progress where this ring opens. */
  from: number
  to: number
  /** How far the petals lean outwards when fully open (degrees from upright). */
  spread: number
  offset: number
  fill: string
}

const RINGS: Ring[] = [
  { count: 13, length: 150, width: 0.62, from: 0.08, to: 0.62, spread: 180, offset: 0, fill: 'url(#petal-outer)' },
  { count: 9, length: 118, width: 0.66, from: 0.22, to: 0.78, spread: 150, offset: 20, fill: 'url(#petal-mid)' },
  { count: 6, length: 84, width: 0.7, from: 0.38, to: 0.92, spread: 110, offset: 30, fill: 'url(#petal-inner)' },
]

const SEPALS = 5
const STAMENS = 14

// A petal of length 1 and width 1, with its base at (0, 0), pointing up.
const PETAL = 'M0 0 C -0.55 -0.22 -0.62 -0.72 0 -1 C 0.62 -0.72 0.55 -0.22 0 0 Z'
const PETAL_VEIN = 'M0 -0.08 C -0.05 -0.4 -0.04 -0.7 0 -0.9'
const SEPAL = 'M0 0 C -0.32 -0.3 -0.3 -0.75 0 -1 C 0.3 -0.75 0.32 -0.3 0 0 Z'

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
// Smooth start and end, so each ring eases open like a real petal.
const ease = (v: number) => v * v * (3 - 2 * v)
const local = (p: number, from: number, to: number) => ease(clamp01((p - from) / (to - from)))

export default function BloomFlower({ progress }: { progress: MotionValue<number> }) {
  const petalRefs = useRef<(SVGGElement | null)[][]>(RINGS.map(() => []))
  const sepalRefs = useRef<(SVGGElement | null)[]>([])
  const centreRef = useRef<SVGGElement | null>(null)
  const stamenRefs = useRef<(SVGCircleElement | null)[]>([])
  const glowRef = useRef<SVGCircleElement | null>(null)

  function draw(p: number) {
    // Sepals: hug the bud, then fold back and down.
    const s = local(p, 0, 0.35)
    for (let i = 0; i < SEPALS; i++) {
      const el = sepalRefs.current[i]
      if (!el) continue
      const side = (i / (SEPALS - 1)) * 2 - 1 // -1 .. 1
      const angle = side * (22 + s * 140)
      el.setAttribute('transform', `rotate(${angle.toFixed(2)}) scale(${(30 + s * 6).toFixed(2)}, ${(62 + s * 22).toFixed(2)})`)
    }

    RINGS.forEach((ring, r) => {
      const t = local(p, ring.from, ring.to)
      const refs = petalRefs.current[r]
      for (let i = 0; i < ring.count; i++) {
        const el = refs[i]
        if (!el) continue
        // Open angle: spread evenly around the flower, centred on "up". Bud angle: almost upright.
        // Evenly around the circle (-180..180), then squeezed into this ring's spread, so inner petals
        // stay cupped while the outer ones open right out.
        let open = ((ring.offset + (i * 360) / ring.count + 180) % 360) - 180
        open *= ring.spread / 180
        const bud = (i / (ring.count - 1) - 0.5) * (r === 0 ? 26 : r === 1 ? 18 : 10)
        const angle = bud + (open - bud) * t
        // Closed petals are narrow and short (wrapped tight in the bud); open ones are full size.
        const length = ring.length * (0.74 + 0.26 * t) * (r === 0 ? 1 : 0.9 + 0.1 * t)
        const width = ring.length * ring.width * (0.46 + 0.54 * t)
        el.setAttribute('transform', `rotate(${angle.toFixed(2)}) scale(${width.toFixed(2)}, ${length.toFixed(2)})`)
        el.setAttribute('opacity', (0.55 + 0.45 * Math.min(1, t * 1.6 + (r === 0 ? 0.45 : 0))).toFixed(3))
      }
    })

    // The heart of the flower and its stamens appear once the inner petals are open.
    const c = local(p, 0.62, 1)
    centreRef.current?.setAttribute('transform', `scale(${(0.35 + 0.65 * c).toFixed(3)})`)
    centreRef.current?.setAttribute('opacity', (0.2 + 0.8 * c).toFixed(3))
    for (let i = 0; i < STAMENS; i++) {
      const el = stamenRefs.current[i]
      if (!el) continue
      const k = local(p, 0.7 + (i % 5) * 0.04, 1)
      el.setAttribute('opacity', k.toFixed(3))
      el.setAttribute('r', (1.5 + 2.4 * k).toFixed(2))
    }
    glowRef.current?.setAttribute('opacity', (0.15 + 0.6 * local(p, 0.3, 1)).toFixed(3))
  }

  useMotionValueEvent(progress, 'change', draw)
  useEffect(() => draw(progress.get()))

  return (
    <svg viewBox="-240 -260 480 480" className="h-full w-full overflow-visible" role="img" aria-label="A flower opening from bud to full bloom">
      <defs>
        <radialGradient id="petal-outer" cx="50%" cy="100%" r="100%">
          <stop offset="0%" stopColor="#9a3412" />
          <stop offset="55%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#fdba74" />
        </radialGradient>
        <radialGradient id="petal-mid" cx="50%" cy="100%" r="100%">
          <stop offset="0%" stopColor="#c2410c" />
          <stop offset="55%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#fed7aa" />
        </radialGradient>
        <radialGradient id="petal-inner" cx="50%" cy="100%" r="100%">
          <stop offset="0%" stopColor="#ea580c" />
          <stop offset="60%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#ffedd5" />
        </radialGradient>
        <linearGradient id="sepal" x1="0" y1="0" x2="0" y2="-1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#1c1410" />
          <stop offset="100%" stopColor="#5a2c12" />
        </linearGradient>
        <linearGradient id="stem" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a1f0e" />
          <stop offset="100%" stopColor="#140c08" />
        </linearGradient>
        <radialGradient id="centre" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#7c2d12" />
          <stop offset="100%" stopColor="#1c1410" />
        </radialGradient>
        <radialGradient id="halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fb923c" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#fb923c" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Warm light behind the flower, growing as it opens */}
      <circle ref={glowRef} cx="0" cy="-20" r="230" fill="url(#halo)" />

      {/* Stem and leaves */}
      <path d="M0 0 C 8 70 -14 150 -6 270" stroke="url(#stem)" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M-4 150 C -60 120 -110 140 -132 110 C -96 96 -40 104 -4 150 Z" fill="#2a160a" />
      <path d="M-2 196 C 50 170 96 186 120 160 C 86 142 34 156 -2 196 Z" fill="#1c1410" />

      {/* Sepals (outside), then petals from the outer ring in */}
      {Array.from({ length: SEPALS }, (_, i) => (
        <g key={`s${i}`} ref={(el) => { sepalRefs.current[i] = el }}>
          <path d={SEPAL} fill="url(#sepal)" />
        </g>
      ))}
      {RINGS.map((ring, r) =>
        Array.from({ length: ring.count }, (_, i) => (
          <g key={`r${r}-${i}`} ref={(el) => { petalRefs.current[r][i] = el }}>
            <path d={PETAL} fill={ring.fill} stroke="#7c2d12" strokeOpacity="0.35" strokeWidth="0.012" />
            <path d={PETAL_VEIN} stroke="#fff7ed" strokeOpacity="0.35" strokeWidth="0.012" fill="none" />
          </g>
        ))
      )}

      {/* The heart of the flower */}
      <g ref={centreRef}>
        <circle r="30" fill="url(#centre)" />
        {Array.from({ length: STAMENS }, (_, i) => {
          const a = (i / STAMENS) * Math.PI * 2
          const d = i % 2 ? 18 : 10
          return <circle key={i} ref={(el) => { stamenRefs.current[i] = el }} cx={Math.cos(a) * d} cy={Math.sin(a) * d} r="2" fill="#fdba74" />
        })}
      </g>
    </svg>
  )
}
