import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  icon: LucideIcon
  children: ReactNode
  footer?: ReactNode
  alert?: boolean
}

// Shared shell for the four dashboard stat cards.
export default function StatCard({ title, icon: Icon, children, footer, alert = false }: StatCardProps) {
  return (
    <div className="flex flex-col justify-between gap-3 rounded-xl bg-surface-container-lowest p-5 shadow-sm ring-1 ring-outline-variant/30">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-secondary">{title}</span>
        <span
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            alert ? 'bg-error-container text-error' : 'bg-surface-container text-primary'
          }`}
        >
          <Icon size={18} />
        </span>
      </div>
      <div>{children}</div>
      {footer && <div>{footer}</div>}
    </div>
  )
}