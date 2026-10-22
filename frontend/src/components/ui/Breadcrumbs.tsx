import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

export interface Crumb {
  label: string
  to?: string
}

export default function Breadcrumbs({ items, tone = 'light' }: { items: Crumb[]; tone?: 'light' | 'dark' }) {
  const dark = tone === 'dark'
  return (
    <nav aria-label="Breadcrumb" className={`flex flex-wrap items-center gap-1.5 text-label-md ${dark ? 'text-primary-fixed-dim' : 'text-on-surface-variant'}`}>
      <Link to="/" className={`flex min-h-9 items-center gap-1 transition-colors sm:min-h-0 ${dark ? 'hover:text-white' : 'hover:text-tertiary'}`}>
        <Home size={15} />
        Home
      </Link>
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="flex items-center gap-1.5">
          <ChevronRight size={14} className={dark ? 'text-primary-fixed-dim/60' : 'text-[#d4af37]'} />
          {item.to ? (
            <Link to={item.to} className={`inline-flex min-h-9 items-center transition-colors sm:min-h-0 ${dark ? 'hover:text-white' : 'hover:text-tertiary'}`}>
              {item.label}
            </Link>
          ) : (
            <span className={`font-semibold ${dark ? 'text-white' : 'text-on-surface'}`} aria-current="page">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}
