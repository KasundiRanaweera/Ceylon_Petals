import type { ReactNode } from 'react'

interface PanelProps {
  title: string
  note?: string
  /** a link or button on the right of the heading */
  action?: ReactNode
  children: ReactNode
  className?: string
}

// The card every owner chart and list sits in, so the pages share one heading style and spacing.
export default function Panel({ title, note, action, children, className = '' }: PanelProps) {
  return (
    <section className={`rounded-xl bg-surface-container-lowest p-5 shadow-sm ring-1 ring-outline-variant/30 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-headline-sm text-primary">{title}</h2>
          {note && <p className="mt-0.5 text-[12px] text-secondary">{note}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  )
}
