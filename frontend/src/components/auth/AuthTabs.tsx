import { Link } from 'react-router-dom'
import { motion } from 'motion/react'

// "Sign in | Create account" switch. The highlight slides between the two (shared layoutId).
export default function AuthTabs({ active, next }: { active: 'sign-in' | 'register'; next?: string }) {
  const query = next ? `?next=${encodeURIComponent(next)}` : ''
  const tabs = [
    { id: 'sign-in' as const, label: 'Sign in', to: `/sign-in${query}` },
    { id: 'register' as const, label: 'Create account', to: `/register${query}` },
  ]
  return (
    <nav aria-label="Account" className="relative grid grid-cols-2 gap-3">
      {tabs.map((t) => (
        <Link
          key={t.id}
          to={t.to}
          aria-current={active === t.id ? 'page' : undefined}
          className={`relative z-10 flex min-h-11 items-center justify-center rounded-lg border py-2.5 text-center text-[12px] font-medium uppercase tracking-[0.14em] transition-colors ${active === t.id ? 'border-primary text-white' : 'border-outline-variant text-on-surface-variant hover:border-[#d4af37] hover:text-tertiary'}`}
        >
          {active === t.id && (
            <motion.span
              layoutId="auth-tab"
              className="absolute -inset-px -z-10 rounded-lg bg-primary"
              transition={{ type: 'spring', bounce: 0.15, visualDuration: 0.35 }}
            />
          )}
          {t.label}
        </Link>
      ))}
    </nav>
  )
}
