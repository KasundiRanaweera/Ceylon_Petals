import { useEffect, useRef, useState } from 'react'
import { useMotionValueEvent, type MotionValue } from 'motion/react'

// A real rose opening from bud to full bloom, played by scroll.
//
// The time-lapse was turned into 48 still frames (public/images/hero/bloom), in a large set for
// desktop and a small set for phones. Scroll progress picks the frame (0 = bud, 1 = full bloom) and
// it is drawn on a canvas. The first frame is a normal <img>, so the hero shows at once; the other
// frames load quietly in the background, and until a frame is in, the nearest loaded one is shown.

export const FRAME_COUNT = 48
const frameUrl = (set: 'd' | 'm', i: number) => `/images/hero/bloom/${set}-${String(i).padStart(2, '0')}.webp`

interface RoseSequenceProps {
  progress: MotionValue<number>
  /** Show just the final, fully open frame (for people who prefer reduced motion). */
  still?: boolean
  className?: string
}

export default function RoseSequence({ progress, still = false, className = '' }: RoseSequenceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frames = useRef<(HTMLImageElement | null)[]>([])
  const shown = useRef(-1)
  const [set] = useState<'d' | 'm'>(() => (typeof window !== 'undefined' && window.innerWidth < 640 ? 'm' : 'd'))
  const [ready, setReady] = useState(false)

  function draw(p: number, force = false) {
    const canvas = canvasRef.current
    if (!canvas) return
    let i = Math.round(Math.min(1, Math.max(0, p)) * (FRAME_COUNT - 1))
    // Not loaded yet: fall back to the nearest earlier frame that is.
    while (i > 0 && !frames.current[i]) i--
    const img = frames.current[i]
    if (!img || (!force && i === shown.current)) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    shown.current = i
  }

  // Load the frames: the first one straight away, the rest in order, a few at a time.
  useEffect(() => {
    if (still) return
    let cancelled = false
    const load = (i: number) =>
      new Promise<void>((resolve) => {
        const img = new Image()
        img.decoding = 'async'
        img.onload = () => {
          if (!cancelled) {
            frames.current[i] = img
            if (i === 0) setReady(true)
            draw(progress.get(), true)
          }
          resolve()
        }
        img.onerror = () => resolve()
        img.src = frameUrl(set, i)
      })
    ;(async () => {
      await load(0)
      for (let i = 1; i < FRAME_COUNT && !cancelled; i += 4) {
        await Promise.all([i, i + 1, i + 2, i + 3].filter((n) => n < FRAME_COUNT).map(load))
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set, still])

  // Keep the canvas sharp at the size it is shown (and redraw after a resize).
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || still) return
    const ro = new ResizeObserver(([entry]) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(entry.contentRect.width * dpr)
      canvas.height = Math.round(entry.contentRect.height * dpr)
      draw(progress.get(), true)
    })
    ro.observe(canvas)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [still])

  useMotionValueEvent(progress, 'change', (p) => draw(p))

  if (still) {
    return <img src={frameUrl(set, FRAME_COUNT - 1)} alt="A deep red rose in full bloom" className={`h-full w-full object-cover ${className}`} />
  }

  return (
    <div className={`relative h-full w-full ${className}`}>
      {/* The bud, shown instantly while the canvas gets ready (it is also the page's main image). */}
      <img
        src={frameUrl(set, 0)}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        decoding="async"
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${ready ? 'opacity-0' : 'opacity-100'}`}
      />
      <canvas ref={canvasRef} role="img" aria-label="A real red rose opening from a bud to full bloom" className="absolute inset-0 h-full w-full" />
    </div>
  )
}
