import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react'
import type { Testimonial } from '../../types'

// "Voices of Bloom": one customer note at a time in a large quote card, with arrows and dots.
// TODO (later phase): replace with GET /api/testimonials once the Testimonial table has real data
const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Dilshan Karunaratne',
    location: 'Colombo 05, Sri Lanka',
    rating: 5,
    message: "The WhatsApp concierge made the whole order effortless for my mother’s birthday in Colombo 05. The roses arrived fresh, beautifully arranged, and lasted beautifully for over a week.",
    orderedItem: "Ordered 'Nuwara Eliya Crimson Empress'",
    initials: 'DK',
  },
  {
    id: '2',
    name: 'Ananya Perera',
    location: 'Cinnamon Gardens, Colombo',
    rating: 5,
    message: 'This flower studio feels premium and personal from start to finish. The lilies arrived smelling incredible and the handwritten card made the gift feel extra special.',
    orderedItem: "Ordered 'Casablanca Pure Ivory Lilies'",
    initials: 'AP',
  },
  {
    id: '3',
    name: 'Rukshan Fernando',
    location: 'Battaramulla, Sri Lanka',
    rating: 5,
    message: 'We ordered a gourmet hamper for a graduation celebration and the delivery was perfectly on time. The packaging and presentation were elegant and very Sri Lankan in style.',
    orderedItem: "Ordered 'Highland Rose & Tea Hamper'",
    initials: 'RF',
  },
]

export default function Testimonials() {
  const [i, setI] = useState(0)
  const t = TESTIMONIALS[i]
  const go = (step: number) => setI((n) => (n + step + TESTIMONIALS.length) % TESTIMONIALS.length)

  return (
    <section aria-labelledby="voices-title" className="bg-surface py-20 lg:py-28">
      <div className="mx-auto max-w-5xl px-4 lg:px-12">
        <div className="mb-12 text-center">
          <p className="text-[13px] font-medium uppercase tracking-[0.22em] text-tertiary">Testimonials</p>
          <h2 id="voices-title" className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] leading-tight text-on-surface">
            Voices of Bloom
          </h2>
        </div>

        <div className="relative rounded-[2rem] bg-surface-container-lowest px-6 py-14 text-center shadow-[0_30px_60px_-36px_rgba(48,48,48,0.4)] sm:px-16 lg:px-24">
          <Quote size={22} className="mx-auto text-[#d4af37]" aria-hidden="true" />
          <AnimatePresence mode="wait">
            <motion.figure key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
              <blockquote className="mt-8 font-display text-[clamp(1.25rem,2.6vw,2rem)] italic leading-snug text-on-surface">“{t.message}”</blockquote>
              <span className="mx-auto mt-10 block h-px w-16 bg-[#d4af37]" aria-hidden="true" />
              <figcaption className="mt-6 text-[14px] tracking-[0.12em] text-on-surface-variant">
                {t.name} — {t.location}
                <span className="mt-1 block text-[13px] tracking-normal text-outline">{t.orderedItem}</span>
              </figcaption>
            </motion.figure>
          </AnimatePresence>

          <button type="button" onClick={() => go(-1)} aria-label="Previous review" className="absolute left-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-xl bg-surface-container-lowest shadow-md hover:text-tertiary sm:left-4">
            <ChevronLeft size={20} />
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Next review" className="absolute right-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-xl bg-surface-container-lowest shadow-md hover:text-tertiary sm:right-4">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="mt-8 flex justify-center gap-2">
          {TESTIMONIALS.map((x, n) => (
            <button
              key={x.id}
              type="button"
              onClick={() => setI(n)}
              aria-label={`Show review ${n + 1}`}
              aria-current={n === i}
              className="flex h-11 w-11 items-center justify-center"
            >
              <span className={`block h-2 rounded-full transition-all ${n === i ? 'w-6 bg-[#d4af37]' : 'w-2 bg-outline-variant'}`} />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
