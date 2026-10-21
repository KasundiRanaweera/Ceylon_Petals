import { useEffect } from 'react'
import { motion } from 'motion/react'
import { useShop } from '../../hooks/useShop'
import { EASE_OUT } from '../motion/variants'
import { INTRO_SEEN_KEY } from '../../lib/intro'

// The opening screen on a visitor's first look at the home page: a line drawing of the Nil Manel
// (the blue water lily, Sri Lanka's national flower) draws itself on cream paper, the shop name
// appears beneath it, then the whole sheet lifts away to the hero. About two and a half seconds,
// once per browser session. A click, tap or key press skips it, and it never shows to visitors who
// have asked their device for reduced motion.

// Petals first (centre, then out to the sides), then the water line, stem, bud and the three
// strokes under the name. Each path draws in turn.
const PETALS = [
  'M60 70 C52 52 54 34 60 20 C66 34 68 52 60 70 Z',
  'M59 70 C46 61 38 47 35 31 C48 37 56 50 59 70 Z',
  'M61 70 C74 61 82 47 85 31 C72 37 64 50 61 70 Z',
  'M58 72 C40 71 26 63 16 50 C33 50 48 58 58 72 Z',
  'M62 72 C80 71 94 63 104 50 C87 50 72 58 62 72 Z',
]
const LINES = [
  'M20 84 C40 93 80 93 100 84',
  'M60 73 L60 132',
  'M60 104 C66 100 71 95 73 87',
  'M73 87 C69 81 71 75 76 72 C80 77 80 83 73 87 Z',
]

export default function IntroSplash({ onDone }: { onDone: () => void }) {
  const { shopName } = useShop()

  useEffect(() => {
    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, '1')
    } catch {
      /* private mode: the intro may show again next time, which is fine */
    }
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    const timer = window.setTimeout(onDone, 2300)
    const skip = () => onDone()
    window.addEventListener('keydown', skip, { once: true })
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', skip)
      root.style.overflow = previous
    }
  }, [onDone])

  const draw = (delay: number, duration = 0.7) => ({
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
    transition: { pathLength: { duration, delay, ease: EASE_OUT }, opacity: { duration: 0.15, delay } },
  })

  return (
    <motion.div
      aria-hidden="true"
      onClick={onDone}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: '-6%', transition: { duration: 0.75, ease: EASE_OUT } }}
      className="fixed inset-0 z-[200] flex cursor-pointer flex-col items-center justify-center bg-[#f3ece4] bg-[radial-gradient(70%_60%_at_50%_45%,#f8f3ee_0%,#efe6dc_100%)] dark:bg-[#141312] dark:bg-[radial-gradient(70%_60%_at_50%_45%,#24211f_0%,#141312_100%)]"
    >
      <svg viewBox="0 0 120 140" className="h-auto w-[132px] text-[#5b4a4f] dark:text-[#dcc3ca] sm:w-[150px]" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
        {PETALS.map((d, i) => (
          <motion.path key={d} d={d} {...draw(0.1 + i * 0.12)} />
        ))}
        {LINES.map((d, i) => (
          <motion.path key={d} d={d} {...draw(0.7 + i * 0.1, 0.55)} />
        ))}
        {/* the gold heart of the lily */}
        <motion.circle
          cx="60"
          cy="66"
          r="2.2"
          fill="#d4af37"
          stroke="none"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.4, visualDuration: 0.4, delay: 0.9 }}
        />
      </svg>
      <motion.p
        initial={{ opacity: 0, letterSpacing: '0.5em' }}
        animate={{ opacity: 1, letterSpacing: '0.32em' }}
        transition={{ duration: 0.9, delay: 0.85, ease: EASE_OUT }}
        className="-mt-12 bg-[#f5efe8] px-3 dark:bg-[#1d1b1a] font-display text-[15px] uppercase text-[#3d3235] dark:text-[#ece6e2] sm:text-[17px]"
      >
        {shopName}
      </motion.p>
    </motion.div>
  )
}
