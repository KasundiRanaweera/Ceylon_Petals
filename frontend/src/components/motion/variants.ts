import type { Transition, Variants } from 'motion/react'

// Shared motion language for the whole site: soft, unhurried and without overshoot —
// a florist, not a game. Durations stay within 300–600 ms.

export const EASE_OUT: Transition['ease'] = [0.22, 1, 0.36, 1]

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: EASE_OUT } },
}

export function staggerContainer(stagger = 0.08, delay = 0): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren: delay } },
  }
}

/** Each word of a headline slides up from behind a mask. */
export const wordRise: Variants = {
  hidden: { y: '110%' },
  show: { y: '0%', transition: { duration: 0.6, ease: EASE_OUT } },
}


/** Same variants, starting later. (A transition inside a variant overrides the `transition` prop.) */
export function withDelay(variants: Variants, delay: number): Variants {
  const show = variants.show as { transition?: Transition }
  return { ...variants, show: { ...show, transition: { ...show.transition, delay } } }
}
