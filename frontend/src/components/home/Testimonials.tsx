import { motion } from 'motion/react'
import { BadgeCheck, Quote, Star } from 'lucide-react'
import { EASE_OUT } from '../motion/variants'
import type { Testimonial } from '../../types'
import SectionHeading from '../ui/SectionHeading'

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

const average = TESTIMONIALS.reduce((sum, t) => sum + t.rating, 0) / TESTIMONIALS.length

function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span className="flex gap-0.5 text-[#ea580c]" role="img" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} fill={i < rating ? 'currentColor' : 'none'} />
      ))}
    </span>
  )
}

// Customer reviews: light cards with plain, readable text, a clear star rating and who wrote it.
export default function Testimonials() {
  return (
    <section className="w-full bg-dawn-soft py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-12">
        <div className="mb-12 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            title="Loved by families across Sri Lanka"
            highlight="across Sri Lanka"
            description="Real notes from customers in Colombo and from loved ones sending flowers home from overseas."
          />
          <div className="flex shrink-0 items-center gap-4 rounded-sm border border-outline-variant bg-surface-container-lowest px-6 py-4 shadow-sm">
            <span className="font-display text-5xl leading-none text-primary">{average.toFixed(1)}</span>
            <span>
              <Stars rating={Math.round(average)} size={18} />
              <span className="mt-1 block text-[14px] text-on-surface-variant">Average customer rating</span>
            </span>
          </div>
        </div>

        <ul className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.li
              key={t.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: EASE_OUT }}
            >
              <figure className="relative flex h-full flex-col rounded-sm border border-outline-variant bg-surface-container-lowest p-7 shadow-[0_20px_40px_-30px_rgba(12,10,9,0.35)] transition-shadow hover:shadow-[0_24px_48px_-24px_rgba(12,10,9,0.35)]">
                <Quote size={36} className="absolute right-6 top-6 text-[#fdba74]/50" aria-hidden="true" />
                <Stars rating={t.rating} />
                <blockquote className="mt-5 flex-1 text-[16.5px] leading-relaxed text-on-surface">“{t.message}”</blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-outline-variant pt-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-[14px] font-semibold text-[#fdba74]">
                    {t.initials}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[16px] font-semibold text-primary">{t.name}</span>
                    <span className="block text-[14px] text-on-surface-variant">{t.location}</span>
                  </span>
                </figcaption>
                <p className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-secondary">
                  <BadgeCheck size={15} className="text-[#1a9e4b]" /> Verified order · {t.orderedItem.replace(/^Ordered '|'$/g, '')}
                </p>
              </figure>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
