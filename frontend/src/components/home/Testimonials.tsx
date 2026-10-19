import { motion } from 'motion/react'
import { Quote, Star } from 'lucide-react'
import { useReviews } from '../../hooks/useReviews'
import { fadeUp, staggerContainer } from '../motion/variants'

function Stars({ rating, size = 15 }: { rating: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`Rated ${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} aria-hidden="true" className={i < Math.round(rating) ? 'fill-[#d4af37] text-[#d4af37]' : 'text-outline-variant'} />
      ))}
    </span>
  )
}

// Customer reviews, all at once in the site's card style: stars, the customer's words, who they are
// and what they ordered, with the average rating above. On phones the cards swipe sideways.
// The reviews come from the owner (Admin -> Reviews); with none published, the section is left out.
export default function Testimonials() {
  const { data } = useReviews()
  if (!data || data.count === 0) return null
  const average = data.average.toFixed(1)

  return (
    <section aria-labelledby="voices-title" className="bg-surface py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-12">
        <div className="mb-12 flex flex-col items-center gap-4 text-center lg:mb-14">
          <p className="text-[13px] font-medium uppercase tracking-[0.22em] text-tertiary">Reviews</p>
          <h2 id="voices-title" className="font-display text-[clamp(2rem,4vw,3rem)] leading-tight text-on-surface">
            What our customers say
          </h2>
          <p className="flex items-center gap-2.5 rounded-full bg-surface-container-lowest px-4 py-2 text-[14px] text-on-surface-variant ring-1 ring-outline-variant/40">
            <Stars rating={data.average} />
            <span>
              <strong className="font-semibold text-on-surface">{average}</strong> from {data.count} {data.count === 1 ? 'review' : 'reviews'}
            </span>
          </p>
        </div>

        <motion.ul
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer(0.1)}
          className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-2 md:gap-6 lg:grid-cols-3 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {data.reviews.map((t) => (
            <motion.li key={t.id} variants={fadeUp} className="w-[84vw] max-w-[360px] shrink-0 snap-center md:w-auto md:max-w-none">
              <figure className="relative flex h-full flex-col rounded-2xl bg-surface-container-lowest p-6 shadow-[0_24px_50px_-34px_rgba(48,48,48,0.45)] ring-1 ring-outline-variant/40 sm:p-7">
                <Quote size={34} aria-hidden="true" className="absolute right-6 top-6 text-primary-fixed" />
                <Stars rating={t.rating} />
                <blockquote className="mt-4 flex-1 font-display text-[17.5px] italic leading-relaxed text-on-surface">&ldquo;{t.message}&rdquo;</blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-outline-variant/50 pt-5">
                  <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-[14px] font-semibold text-tertiary">
                    {t.initials}
                  </span>
                  <span className="min-w-0 leading-tight">
                    <span className="block text-[15px] font-semibold text-on-surface">{t.name}</span>
                    <span className="mt-0.5 block text-[13px] text-on-surface-variant">{t.location}</span>
                    {t.orderedItem && <span className="mt-1 block truncate text-[12.5px] text-tertiary">{t.orderedItem}</span>}
                  </span>
                </figcaption>
              </figure>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}
