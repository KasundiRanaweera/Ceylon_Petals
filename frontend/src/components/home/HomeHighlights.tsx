import { motion } from 'motion/react'
import { useQuery } from '@tanstack/react-query'
import AnimatedNumber from '../motion/AnimatedNumber'
import { fadeUp, staggerContainer } from '../motion/variants'
import { listProducts } from '../../services/catalog'
import { useShop } from '../../hooks/useShop'

// Live shop numbers, right under the hero.
export default function HomeHighlights() {
  const { sameDayCutoff, deliveryZones } = useShop()
  const { data: products } = useQuery({ queryKey: ['products', {}], queryFn: () => listProducts() })

  const stats = [
    { value: products?.length ?? 0, suffix: '+', label: 'Arrangements, made daily' },
    { value: deliveryZones.filter((z) => z.active).length, suffix: '', label: 'Districts we deliver to' },
    { value: Number(sameDayCutoff.split(':')[0]) % 12 || 12, suffix: ' PM', label: 'Same-day order cut-off' },
    { value: 7, suffix: ' days', label: 'Freshness, guaranteed' },
  ]

  return (
    <section id="home-next" className="scroll-mt-28 bg-surface">
      <div className="mx-auto max-w-7xl px-4 lg:px-12">
        <motion.dl
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={staggerContainer(0.08)}
          className="grid grid-cols-2 gap-y-8 border-b border-outline-variant py-12 lg:grid-cols-4 lg:py-16"
        >
          {stats.map((s, i) => (
            <motion.div key={s.label} variants={fadeUp} className={`flex flex-col px-1 lg:px-8 ${i > 0 ? 'lg:border-l lg:border-outline-variant' : ''}`}>
              {/* dt must come first in the markup; CSS order shows the number on top. */}
              <dt className="eyebrow order-2 mt-2 text-secondary">{s.label}</dt>
              <dd className="order-1">
                <AnimatedNumber value={s.value} suffix={s.suffix} className="text-gradient font-display text-5xl italic lg:text-6xl" />
              </dd>
            </motion.div>
          ))}
        </motion.dl>
      </div>
    </section>
  )
}
