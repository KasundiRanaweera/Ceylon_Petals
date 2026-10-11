import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { EASE_OUT, fadeUp, staggerContainer } from './variants'

// Scroll-in reveals. Content fades up once when it first enters the viewport.

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
  as?: 'div' | 'section' | 'li'
}

export function Reveal({ children, className, delay = 0, as = 'div' }: RevealProps) {
  const Tag = motion[as]
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.05 }}
      variants={{
        hidden: { opacity: 0, y: 24 },
        // A transition inside a variant wins over the transition prop, so the delay lives here.
        show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT, delay } },
      }}
    >
      {children}
    </Tag>
  )
}

/** Children wrapped in <RevealItem> appear one after another. */
export function RevealGroup({ children, className, stagger = 0.08, delay = 0 }: { children: ReactNode; className?: string; stagger?: number; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
      variants={staggerContainer(stagger, delay)}
    >
      {children}
    </motion.div>
  )
}

export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={fadeUp}>
      {children}
    </motion.div>
  )
}
