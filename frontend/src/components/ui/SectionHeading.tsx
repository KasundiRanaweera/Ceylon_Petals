import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { fadeUp, staggerContainer } from '../motion/variants'

interface SectionHeadingProps {
  title: string
  /** Part of the title set in gold italic. */
  highlight?: string
  description?: string
  action?: { label: string; to: string }
  tone?: 'light' | 'dark'
  className?: string
}

// Magazine-style section opener: an oversized serif title, with the supporting copy + link
// set to the right.
export default function SectionHeading({ title, highlight, description, action, tone = 'light', className = '' }: SectionHeadingProps) {
  const dark = tone === 'dark'
  const parts = highlight && title.includes(highlight) ? title.split(highlight) : [title]

  return (
    <motion.header
      className={`space-y-6 ${className}`}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      variants={staggerContainer(0.08)}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
        <motion.h2
          variants={fadeUp}
          className={`font-display text-[40px] leading-[1.02] tracking-tight sm:text-5xl lg:col-span-7 lg:text-[64px] ${dark ? 'text-white' : 'text-primary'}`}
        >
          {parts[0]}
          {parts.length > 1 && <em className={`italic ${dark ? 'text-gradient-light' : 'text-gradient'}`}>{highlight}</em>}
          {parts[1]}
        </motion.h2>
        {(description || action) && (
          <motion.div variants={fadeUp} className="space-y-4 lg:col-span-5 lg:pl-10">
            {description && <p className={`text-body-lg ${dark ? 'text-white/75' : 'text-secondary'}`}>{description}</p>}
            {action && (
              <Link
                to={action.to}
                className={`group inline-flex items-center gap-2 border-b pb-1 text-[13px] font-medium uppercase tracking-[0.18em] transition-colors ${
                  dark ? 'border-tertiary-fixed-dim text-white hover:text-tertiary-fixed-dim' : 'border-primary text-primary hover:border-tertiary hover:text-tertiary'
                }`}
              >
                {action.label}
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </motion.div>
        )}
      </div>
    </motion.header>
  )
}
