import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowRight, PenLine } from 'lucide-react'
import { listProducts } from '../../services/catalog'
import { sizedImage } from '../../lib/images'
import { EASE_OUT } from '../motion/variants'
import type { Product } from '../../types'

// "Every bouquet comes with a card": four of our bouquets, each with a handwritten gift card
// tucked against it. The cards are drawn here (cream card, handwriting, a gold seal), and the
// messages are examples of what customers write; the real card says whatever the customer types
// at checkout.
//
// Motion: as the row scrolls in, each photo rises into place and then its card slides out from
// behind it and settles at a slight angle, one bouquet after another. On hover the photo zooms
// gently and the card lifts and straightens. With reduced motion everything simply appears.

const GIFTS: { product: string; to: string; message: string; from: string; tilt: number }[] = [
  { product: 'highland-blush-symphony', to: 'Amma', message: 'Happy birthday to the one who taught me to love flowers.', from: 'Nimal', tilt: -6 },
  { product: 'nuwara-eliya-crimson-empress', to: 'Dilini', message: 'Ten years, and you still make every day feel new.', from: 'Kasun', tilt: 5 },
  { product: 'casablanca-pure-ivory-lilies', to: 'Aunty Rose', message: 'Thinking of you and keeping you close in our prayers.', from: 'The Pereras', tilt: -4 },
  { product: 'sunburst-morning-jubilee', to: 'Sachini', message: 'First class honours! So proud of you.', from: 'Your team', tilt: 6 },
]

export default function GiftCards() {
  const reduce = useReducedMotion()
  const { data: products } = useQuery({ queryKey: ['products', {}], queryFn: () => listProducts() })
  const find = (slug: string): Product | undefined => products?.find((p) => p.slug === slug)

  return (
    <section aria-labelledby="gift-cards-title" className="overflow-hidden bg-surface-container-low py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-12">
        <motion.div
          className="mx-auto mb-12 max-w-3xl text-center lg:mb-14"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
        >
          <h2 id="gift-cards-title" className="font-display text-[clamp(2rem,4vw,3rem)] leading-tight text-on-surface">
            Every bouquet comes with a card
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-on-surface-variant">
            Type your message at checkout and we write it by hand on a cream card, free with every order. A few examples of what you
            might say:
          </p>
        </motion.div>

        <motion.ul
          className="-mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-10 pt-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-8 sm:overflow-visible sm:px-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden"
          initial={reduce ? false : 'hidden'}
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.15 } } }}
        >
          {GIFTS.map((g) => {
            const product = find(g.product)
            return (
              <motion.li
                key={g.product}
                className="w-[70vw] max-w-[280px] shrink-0 snap-center sm:w-auto sm:max-w-none"
                variants={{ hidden: { opacity: 0, y: 50 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT } } }}
              >
                <Link
                  to={product ? `/product/${product.slug}` : '/shop'}
                  className="group relative block pb-16 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-tertiary"
                >
                  <span className="relative block aspect-[4/5] overflow-hidden rounded-[18px] bg-surface-container shadow-[0_24px_50px_-30px_rgba(48,48,48,0.55)]">
                    {product && (
                      <img
                        src={sizedImage(product.images[0], 640)}
                        alt={product.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.06] motion-reduce:transition-none"
                      />
                    )}
                  </span>

                  {/* the gift card: slides out from behind the photo, then settles at an angle */}
                  <motion.span
                    aria-hidden="true"
                    className="absolute -bottom-1 right-[-6px] block w-[78%] sm:right-[-14px]"
                    variants={{
                      hidden: { opacity: 0, y: -40, x: -30, rotate: 0 },
                      show: { opacity: 1, y: 0, x: 0, rotate: g.tilt, transition: { type: 'spring', bounce: 0.3, visualDuration: 0.8, delay: 0.35 } },
                    }}
                  >
                    <span className="gift-card block rounded-[6px] bg-[#fffaf2] px-5 pb-4 pt-5 shadow-[0_18px_34px_-16px_rgba(48,48,48,0.55)] ring-1 ring-[#e8dcc6] transition-transform duration-500 ease-out group-hover:-translate-y-2 group-hover:rotate-0 motion-reduce:transition-none">
                      {/* gold wax seal */}
                      <span className="absolute -top-3 left-5 flex h-7 w-7 items-center justify-center rounded-full bg-[linear-gradient(135deg,#e9c349,#b8912a)] text-[10px] font-semibold text-[#1b1c1c] shadow-md">
                        CP
                      </span>
                      <span className="block font-hand text-[21px] leading-tight text-[#6b5a60]">Dear {g.to},</span>
                      <span className="mt-1 block font-hand text-[22px] leading-[1.15] text-[#3d3235]">{g.message}</span>
                      <span className="mt-2 block text-right font-hand text-[20px] text-[#6b5a60]">— {g.from}</span>
                    </span>
                  </motion.span>
                </Link>
                {product && (
                  <p className="mt-2 px-1 text-[13.5px] text-on-surface-variant">
                    <span className="font-medium text-on-surface">{product.name}</span>
                  </p>
                )}
              </motion.li>
            )
          })}
        </motion.ul>

        <motion.div
          className="mt-4 flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-center"
          initial={reduce ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <span className="inline-flex items-center gap-2 text-[14px] text-on-surface-variant">
            <PenLine size={16} aria-hidden="true" className="text-tertiary" /> Free handwritten card with every order
          </span>
          <Link to="/shop" className="group inline-flex min-h-[44px] items-center gap-2 rounded-full border border-on-surface/20 px-6 text-[15px] text-on-surface transition-colors hover:border-tertiary hover:bg-tertiary hover:text-on-tertiary">
            Choose a bouquet <ArrowRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
