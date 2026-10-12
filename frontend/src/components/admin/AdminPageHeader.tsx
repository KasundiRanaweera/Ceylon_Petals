import type { ReactNode } from 'react'

interface AdminPageHeaderProps {
  eyebrow: string
  title: string
  subtitle?: string
  actions?: ReactNode
}

// Same heading style as Overview and Orders, so every owner page looks alike.
export default function AdminPageHeader({ eyebrow, title, subtitle, actions }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <span className="text-[11px] text-secondary tracking-widest uppercase block mb-1">{eyebrow}</span>
        <h1 className="font-display text-headline-lg text-primary tracking-tight">{title}</h1>
        {subtitle && <p className="text-body-md text-secondary mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  )
}
