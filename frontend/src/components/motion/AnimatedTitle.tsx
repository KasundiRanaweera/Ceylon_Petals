import { motion } from 'motion/react'
import { staggerContainer, wordRise } from './variants'

interface AnimatedTitleProps {
  text: string
  /** Words from `text` shown in italic accent colour, e.g. "every heartfelt moment". */
  highlight?: string
  className?: string
  highlightClassName?: string
  delay?: number
  as?: 'h1' | 'h2' | 'span'
}

// Headline whose words rise one by one. Screen readers get the plain sentence.
export default function AnimatedTitle({
  text,
  highlight,
  className = '',
  highlightClassName = 'italic text-tertiary',
  delay = 0,
  as = 'h1',
}: AnimatedTitleProps) {
  const Tag = motion[as]
  const highlightStart = highlight ? text.indexOf(highlight) : -1
  const words: { word: string; accent: boolean }[] = []
  let cursor = 0
  for (const word of text.split(' ')) {
    const index = text.indexOf(word, cursor)
    cursor = index + word.length
    const accent = highlightStart >= 0 && index >= highlightStart && index < highlightStart + (highlight?.length ?? 0)
    words.push({ word, accent })
  }

  return (
    <Tag className={className} aria-label={text} initial="hidden" animate="show" variants={staggerContainer(0.06, delay)}>
      {words.map(({ word, accent }, i) => (
        <span key={`${word}-${i}`} aria-hidden="true" className="inline-block overflow-hidden align-bottom pb-[0.22em] -mb-[0.22em]">
          <motion.span className={`inline-block ${accent ? highlightClassName : ''}`} variants={wordRise}>
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </Tag>
  )
}
