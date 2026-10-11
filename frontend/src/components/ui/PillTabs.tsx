import { useId } from 'react'
import { motion } from 'motion/react'

interface PillTabsProps {
  options: { id: string; label: string }[]
  active: string
  onChange: (id: string) => void
  label: string
}

// Editorial filter tabs: uppercase labels with a gold underline that slides to the chosen one.
// (Kept the PillTabs name so existing pages don't change.) useId keeps each underline separate.
export default function PillTabs({ options, active, onChange, label }: PillTabsProps) {
  const groupId = useId()
  return (
    <div className="flex items-center gap-7 overflow-x-auto border-b border-outline-variant" role="tablist" aria-label={label}>
      {options.map((o) => {
        const selected = o.id === active
        return (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(o.id)}
            className={`relative cursor-pointer whitespace-nowrap pb-3 pt-1 text-[12px] font-medium uppercase tracking-[0.16em] transition-colors ${
              selected ? 'text-primary' : 'text-secondary hover:text-primary'
            }`}
          >
            {o.label}
            {selected && (
              <motion.span
                layoutId={`tab-${groupId}`}
                className="bg-brand-gradient absolute inset-x-0 -bottom-px h-0.5"
                transition={{ type: 'spring', bounce: 0.15, visualDuration: 0.35 }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
