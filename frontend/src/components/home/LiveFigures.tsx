import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { useShop } from '../../hooks/useShop'
import { listProducts } from '../../services/catalog'
import { formatClock } from '../../lib/dates'
import { EASE_OUT, fadeUp, staggerContainer } from '../motion/variants'

// A figure that counts up from zero the first time it scrolls into view. Only the leading number
// counts; the rest ("+", " PM") is shown as it is. Text without a number is shown as it is.
function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const reduce = useReducedMotion()
  const match = value.match(/^(\d+)(.*)$/)
  const target = match ? Number(match[1]) : 0
  const rest = match ? match[2] : ''
  const count = useMotionValue(0)
  const text = useTransform(count, (n) => `${Math.round(n)}${rest}`)

  useEffect(() => {
    if (!inView || reduce) return
    const controls = animate(count, target, { duration: 1.4, ease: EASE_OUT })
    return () => controls.stop()
  }, [inView, reduce, target, count])

  if (!match || reduce) return <span ref={ref}>{value}</span>
  return <motion.span ref={ref}>{text}</motion.span>
}

// The dark figures band. Every figure is real: it comes from the catalogue and the owner's settings.
export default function LiveFigures() {
  const shop = useShop()
  const reduce = useReducedMotion()
  const { data: products } = useQuery({ queryKey: ['products', {}], queryFn: () => listProducts() })
  const figures = [
    { value: products ? `${products.length}+` : '—', label: 'Arrangements in the shop' },
    { value: String(shop.deliveryZones.filter((z) => z.active).length), label: 'Districts we deliver to' },
    { value: formatClock(shop.sameDayCutoff), label: 'Same-day order cut-off' },
    { value: 'Fresh', label: 'Cut every morning' },
  ]
  return (
    <section aria-label="The shop in figures" className="relative overflow-hidden bg-primary py-16 lg:py-24">
      {/* A soft gold glow that drifts slowly across the band. */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-0 size-[520px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(233,195,73,0.16),transparent_65%)]"
        animate={reduce ? undefined : { x: ['-20%', '220%', '-20%'] }}
        transition={{ duration: 28, ease: 'easeInOut', repeat: Infinity }}
      />
      <motion.dl
        className="relative mx-auto grid max-w-7xl grid-cols-2 gap-y-12 px-4 text-center lg:grid-cols-4 lg:px-12"
        initial={reduce ? false : 'hidden'}
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        variants={staggerContainer(0.12)}
      >
        {figures.map((f, i) => (
          <motion.div
            key={f.label}
            variants={fadeUp}
            className={`flex flex-col items-center border-white/10 px-4 ${i % 2 ? 'border-l' : ''} ${i === 2 ? 'lg:border-l' : ''}`}
          >
            <dt className="order-2 mt-4 text-[12px] uppercase tracking-[0.2em] text-white/60">{f.label}</dt>
            <dd className="order-1 font-display text-[clamp(2.5rem,5.5vw,4.25rem)] leading-none text-[#e9c349] tabular-nums">
              <CountUp value={f.value} />
              <motion.span
                aria-hidden="true"
                className="mx-auto mt-5 block h-px w-12 origin-center bg-[#e9c349]/70"
                variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 0.7, ease: EASE_OUT, delay: 0.3 } } }}
              />
            </dd>
          </motion.div>
        ))}
      </motion.dl>
    </section>
  )
}
