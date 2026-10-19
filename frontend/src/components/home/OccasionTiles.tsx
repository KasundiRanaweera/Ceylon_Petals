import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { fadeUp, staggerContainer } from '../motion/variants'

// "Expressions of Elegance": one photo tile per occasion. Each opens the shop filtered to it.
const TILES = [
  { slug: 'birthday', label: 'Birthday', img: 'occ-birthday' },
  { slug: 'anniversary', label: 'Anniversary', img: 'occ-anniversary' },
  { slug: 'congratulations', label: 'Graduation', img: 'occ-graduation' },
  { slug: 'love', label: 'Love', img: 'occ-love' },
  { slug: 'sympathy', label: 'Sympathy', img: 'occ-sympathy' },
  { slug: 'get-well', label: 'Get Well', img: 'occ-valentine' },
  { slug: 'wedding', label: 'Wedding', img: 'occ-wedding' },
]

export default function OccasionTiles() {
  return (
    <section aria-labelledby="occasions-title" className="bg-surface py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-12">
        <div className="mb-12 text-center lg:mb-16">
          <p className="text-[13px] font-medium uppercase tracking-[0.22em] text-tertiary">Curated selections</p>
          <h2 id="occasions-title" className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] leading-tight text-on-surface">
            Expressions of Elegance
          </h2>
        </div>
        <motion.ul
          className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 lg:grid-cols-7 [&::-webkit-scrollbar]:hidden"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer(0.06)}
        >
          {TILES.map((t) => (
            <motion.li key={t.slug} variants={fadeUp} className="w-[38vw] shrink-0 snap-start sm:w-auto">
              <Link to={`/shop?occasion=${t.slug}`} className="group block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-tertiary">
                <span className="block aspect-[3/4] overflow-hidden rounded-xl bg-surface-container shadow-[0_14px_30px_-20px_rgba(48,48,48,0.45)]">
                  <img
                    src={`/images/stitch/${t.img}.webp`}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none"
                  />
                </span>
                <span className="mt-4 block text-center text-[15px] tracking-[0.04em] text-on-surface transition-colors group-hover:text-tertiary">{t.label}</span>
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}
