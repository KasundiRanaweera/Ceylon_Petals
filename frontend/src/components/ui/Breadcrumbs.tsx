import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

export interface Crumb {
  label: string
  to?: string
}

export default function Breadcrumbs({ items, tone = 'light' }: { items: Crumb[]; tone?: 'light' | 'dark' }) {
  const dark = tone === 'dark'
  return (
    <nav aria-label="Breadcrumb" className={`flex flex-wrap items-center gap-1.5 text-label-md ${dark ? 'text-primary-fixed-dim' : 'text-secondary'}`}>
      <Link to="/" className={`flex items-center gap-1 transition-colors ${dark ? 'hover:text-white' : 'hover:text-primary'}`}>
        <Home size={15} />
        Home
      </Link>
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="flex items-center gap-1.5">
          <ChevronRight size={14} className={dark ? 'text-primary-fixed-dim/60' : 'text-outline-variant'} />
          {item.to ? (
            <Link to={item.to} className={`transition-colors ${dark ? 'hover:text-white' : 'hover:text-primary'}`}>
              {item.label}
            </Link>
          ) : (
            <span className={`font-bold ${dark ? 'text-white' : 'text-primary'}`} aria-current="page">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}
