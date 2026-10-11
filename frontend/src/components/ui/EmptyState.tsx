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
    <div className="bg-surface-container-lowest rounded-xl shadow-sm p-10 text-center space-y-3">
      <div className="w-14 h-14 mx-auto rounded-full bg-surface-container flex items-center justify-center text-primary">
        <Icon size={24} />
      </div>
      <h2 className="font-display text-headline-sm text-primary">{title}</h2>
      {message && <div className="text-body-md text-secondary max-w-md mx-auto">{message}</div>}
      {action && <div className="pt-2 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  )
}
