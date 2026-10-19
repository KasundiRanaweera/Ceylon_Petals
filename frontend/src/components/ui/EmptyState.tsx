import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  message?: ReactNode
  action?: ReactNode
}

export default function EmptyState({ icon: Icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="rounded-xl bg-surface-container-lowest ring-1 ring-outline-variant/40 shadow-[0_18px_40px_-28px_rgba(48,48,48,0.35)] p-8 sm:p-12 text-center space-y-3">
      <div className="w-14 h-14 mx-auto rounded-full bg-primary-fixed flex items-center justify-center text-tertiary">
        <Icon size={24} />
      </div>
      <h2 className="font-display text-on-surface text-headline-sm">{title}</h2>
      {message && <div className="text-body-md text-on-surface-variant max-w-md mx-auto">{message}</div>}
      {action && <div className="pt-2 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  )
}
