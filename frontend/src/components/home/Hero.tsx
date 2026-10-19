import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { ArrowRight, Clock, MessageCircle, PenLine, ShieldCheck, Star, Truck } from 'lucide-react'
import { EASE_OUT } from '../motion/variants'
import { useShop, useWhatsApp } from '../../hooks/useShop'
import { useCutoffCountdown } from '../../hooks/useCutoffCountdown'
import { AVERAGE_RATING } from '../../data/testimonials'

// The first screen, on the shop's own cream and gold. Left: the live same-day countdown, the
// headline, a line about the shop, the two ways to order and four promises. Right: a hand-held
// bouquet (cut out, no background) standing clear in a soft gold arch.
//
// Motion: the words rise in order and "Bloom" catches one gold shimmer; the arch draws up, the
// bouquet settles and then sways gently. It waits for the opening screen to
// lift, and the bouquet drifts a little as you scroll.

const BOUQUET = { small: '/images/home/hero-bouquet-720.webp', large: '/images/home/hero-bouquet-1200.webp' }
const HEADLINE = ['Make', 'Every', 'Moment']

export default function Hero({ ready = true }: { ready?: boolean }) {
  const reduce = useReducedMotion()
  const shop = useShop()
  const whatsapp = useWhatsApp()
  const minutesLeft = useCutoffCountdown(shop.sameDayCutoff)

  const section = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end start'] })
  const bouquetY = useTransform(scrollYProgress, [0, 1], ['0%', '10%'])


  // Until the opening screen lifts, everything waits at its starting pose.
  const play = <T,>(target: T) => (ready ? target : undefined)
  const rise = (delay: number) => ({
    initial: { opacity: 0, y: 22 },
    animate: play({ opacity: 1, y: 0 }),
    transition: { duration: 0.75, delay, ease: EASE_OUT },
  })

  const promises = [
    { icon: Truck, label: 'Same-day in Colombo' },
    { icon: PenLine, label: 'Free handwritten card' },
    { icon: ShieldCheck, label: 'Freshness guaranteed' },
    { icon: Star, label: `${AVERAGE_RATING} from customers`, href: '#voices-title' },
  ]

  return (
    <section
      ref={section}
      aria-labelledby="home-hero-title"
      className="relative overflow-hidden bg-surface bg-[radial-gradient(60%_55%_at_85%_10%,rgba(252,228,236,0.75)_0%,rgba(252,228,236,0)_70%),radial-gradient(50%_60%_at_5%_90%,rgba(233,195,73,0.14)_0%,rgba(233,195,73,0)_70%)]"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 pb-14 pt-10 md:grid-cols-2 lg:gap-16 lg:px-12 lg:pb-12 lg:pt-14">
        {/* ---- the words ---- */}
        <div>
          <motion.p {...rise(0.15)} className="inline-flex items-center gap-2 rounded-full bg-[#1b1c1c] px-4 py-2 text-[13px] font-medium text-white sm:text-[14px]">
            <Clock size={16} aria-hidden="true" className="shrink-0 text-[#e9c349]" />
            {!shop.acceptingOrders ? (
              'Online orders are paused today'
            ) : minutesLeft !== null ? (
              <span>
                Same-day<span className="hidden sm:inline"> delivery</span> — order within {Math.floor(minutesLeft / 60)}h {minutesLeft % 60}m
              </span>
            ) : (
              'Order now for next-day delivery'
            )}
          </motion.p>

          <h1 id="home-hero-title" className="mt-6 font-display text-[clamp(2.9rem,5.4vw,5rem)] font-normal leading-[1.03] tracking-[-0.015em] text-[#1b1c1c]">
            {HEADLINE.map((word, i) => (
              <span key={word}>
                <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                  <motion.span
                    className="inline-block"
                    initial={{ y: '108%' }}
                    animate={play({ y: '0%' })}
                    transition={{ type: 'spring', bounce: 0, visualDuration: 0.85, delay: 0.3 + i * 0.1 }}
                  >
                    {word}
                  </motion.span>
                </span>{' '}
              </span>
            ))}
            <span className="inline-block overflow-hidden pb-[0.08em] pr-[0.08em] align-bottom">
              <motion.span
                className="hero-bloom inline-block italic"
                initial={{ y: '108%' }}
                animate={play({ y: '0%' })}
                transition={{ type: 'spring', bounce: 0, visualDuration: 0.85, delay: 0.6 }}
              >
                Bloom
              </motion.span>
            </span>
          </h1>

          <motion.p {...rise(0.8)} className="mt-5 max-w-[34rem] text-[16px] leading-[1.75] text-on-surface-variant sm:text-[17.5px]">
            Hand-tied bouquets of Nuwara Eliya roses, lilies and orchids — arranged in Colombo each morning and delivered across Sri Lanka with
            a handwritten card.
          </motion.p>

          <motion.div {...rise(0.95)} className="mt-7 flex flex-wrap gap-3">
            <Link to="/shop" className="hero-spring btn-gradient inline-flex min-h-[54px] items-center gap-3 px-8 text-[14px] font-semibold uppercase tracking-[0.14em]">
              Shop flowers <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <a
              href={whatsapp('Hello! I would like to order flowers.')}
              target="_blank"
              rel="noopener noreferrer"
              className="hero-spring inline-flex min-h-[54px] items-center gap-3 rounded-lg border border-[#1b1c1c]/15 bg-surface-container-lowest px-7 text-[14px] font-semibold uppercase tracking-[0.12em] text-[#1b1c1c] hover:border-[#1b1c1c]/40 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#1b1c1c]"
            >
              <MessageCircle size={19} aria-hidden="true" className="text-[#25D366]" /> Order on WhatsApp
            </a>
          </motion.div>

          <motion.ul
            initial="hidden"
            animate={play('show')}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 1.1 } } }}
            className="mt-8 grid max-w-[34rem] grid-cols-2 gap-x-6 gap-y-3 border-t border-outline-variant/60 pt-5 text-[14px] text-on-surface sm:text-[15px]"
          >
            {promises.map(({ icon: Icon, label, href }) => (
              <motion.li
                key={label}
                variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } } }}
                className="flex items-center gap-2.5"
              >
                <Icon size={17} aria-hidden="true" className={Icon === Star ? 'fill-[#d4af37] text-[#d4af37]' : 'text-tertiary'} />
                {href ? (
                  <a href={href} className="underline-offset-4 hover:text-tertiary hover:underline">
                    {label}
                  </a>
                ) : (
                  label
                )}
              </motion.li>
            ))}
          </motion.ul>
        </div>

        {/* ---- the bouquet, standing in its gold arch ---- */}
        <div className="relative mx-auto aspect-[4/5] w-full max-w-[340px] sm:max-w-[420px] lg:max-w-[500px]">
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0, scaleY: 0.6 }}
            animate={play({ opacity: 1, scaleY: 1 })}
            transition={{ duration: 1.1, delay: 0.2, ease: EASE_OUT }}
            className="absolute inset-x-[7%] bottom-0 top-0 origin-bottom rounded-t-full bg-[linear-gradient(180deg,#f7ecd6_0%,#f6e6e9_70%,#f3e3e6_100%)]"
          >
            <span className="absolute -inset-2.5 rounded-t-full border border-[#d4af37]/45" />
          </motion.div>

          <motion.div style={reduce ? undefined : { y: bouquetY }} className="absolute bottom-[4%] left-[-10%] w-[120%]">
            <motion.img
              src={BOUQUET.large}
              srcSet={`${BOUQUET.small} 720w, ${BOUQUET.large} 1209w`}
              sizes="(min-width: 1024px) 600px, 120vw"
              alt="A hand holding a bouquet of pink roses, peach peonies, daisies and yellow tansy"
              fetchPriority="high"
              initial={{ opacity: 0, y: 40, scale: 0.94 }}
              animate={play({ opacity: 1, y: 0, scale: 1 })}
              transition={{ type: 'spring', bounce: 0.2, visualDuration: 1, delay: 0.45 }}
              className={`hero-bouquet relative w-full drop-shadow-[0_30px_40px_rgba(107,90,96,0.25)] ${ready && !reduce ? 'hero-bouquet-sway' : ''}`}
            />
          </motion.div>

        </div>

      </div>

    </section>
  )
}
