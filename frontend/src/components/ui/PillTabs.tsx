import { useEffect, useId, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'

export interface PillOption {
  id: string
  label: string
  /** How many items this choice has (shown as a small number). Null/undefined = not shown. */
  count?: number | null
  icon?: LucideIcon
  /** When set, the chip is a link (used where each category has its own web address). */
  to?: string
}

interface PillTabsProps {
  options: PillOption[]
  active: string
  onChange?: (id: string) => void
  /** What the group is, for screen readers ("Categories", "Hamper collections"...). */
  label: string
  /** Wrap onto several lines instead of scrolling sideways (for short lists of links). */
  wrap?: boolean
}

// The one category picker used on every shop page (Shop, Bouquets, Roses, Occasions, Hampers, Plants),
// so choosing a category looks and feels the same everywhere.
//
// Rounded chips; the chosen one is filled with the dark "dusk" gradient and gold text, and that
// highlight glides to the next choice. On phones the row scrolls sideways (the edges fade out) and
// the chosen chip is slid into view; from tablet width up the chips wrap, so all of them show.
export default function PillTabs({ options, active, onChange, label, wrap = false }: PillTabsProps) {
  const groupId = useId()
  const asLinks = options.some((o) => o.to)
  const rowRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  // Keep the chosen chip in view inside the sideways-scrolling row (it may start off-screen when a
  // page opens on a later choice, e.g. ?tab=corporate). Only the row scrolls, never the page.
  useEffect(() => {
    const row = rowRef.current
    const chip = row?.querySelector<HTMLElement>('[data-selected="true"]')
    if (!row || !chip || row.scrollWidth <= row.clientWidth) return
    const left = chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2
    row.scrollTo({ left: Math.max(0, left), behavior: reduce ? 'auto' : 'smooth' })
  }, [active, options.length, reduce])

  const chip = (o: PillOption) => {
    const selected = o.id === active
    const Icon = o.icon
    const inner = (
      <>
        {selected && (
          <motion.span
            layoutId={`chip-${groupId}`}
            aria-hidden="true"
            className="bg-ink-gradient absolute inset-0 rounded-full shadow-[0_12px_24px_-14px_rgba(36,17,27,0.8)]"
            transition={{ type: 'spring', bounce: 0.18, visualDuration: 0.35 }}
          />
        )}
        {Icon && <Icon size={16} aria-hidden="true" className={`relative shrink-0 ${selected ? 'text-[#f5d27a]' : 'text-tertiary'}`} />}
        <span className="relative">{o.label}</span>
        {o.count !== undefined && o.count !== null && (
          <span
            className={`relative min-w-[1.5rem] rounded-full px-1.5 py-0.5 text-center text-[11px] font-semibold tabular-nums ${
              selected ? 'bg-white/15 text-[#f5e6c8]' : 'bg-surface-container text-secondary'
            }`}
          >
            {o.count}
          </span>
        )}
      </>
    )
    const cls = `relative inline-flex min-h-[44px] shrink-0 cursor-pointer snap-start items-center gap-2 whitespace-nowrap rounded-full border px-4 text-[14px] font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
      selected ? 'border-transparent text-white' : 'border-outline-variant bg-white/75 text-primary hover:border-[#c8930a]/60 hover:bg-white'
    }`
    return o.to ? (
      <Link key={o.id} to={o.to} aria-current={selected ? 'page' : undefined} data-selected={selected} className={cls}>
        {inner}
      </Link>
    ) : (
      <button key={o.id} type="button" role="tab" aria-selected={selected} data-selected={selected} onClick={() => onChange?.(o.id)} className={cls}>
        {inner}
      </button>
    )
  }

  // Phones: one sideways-scrolling row. Tablets and up: the chips wrap, so every choice is visible.
  const row = wrap
    ? 'relative flex flex-wrap gap-2'
    : 'relative flex snap-x snap-mandatory gap-2 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:overflow-visible'
  const fade = wrap ? '' : '-mx-1 px-1 [mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-24px),transparent)] md:[mask-image:none]'

  return asLinks ? (
    <nav aria-label={label} className={fade}>
      <div ref={rowRef} className={row}>
        {options.map(chip)}
      </div>
    </nav>
  ) : (
    <div className={fade}>
      <div ref={rowRef} role="tablist" aria-label={label} className={row}>
        {options.map(chip)}
      </div>
    </div>
  )
}
