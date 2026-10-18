import { Link } from 'react-router-dom'
import { useShop } from '../../hooks/useShop'

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function Logo({ onClick }: { onClick?: () => void }) {
  const { shopName, tagline } = useShop()
  return (
    <Link to="/" onClick={onClick} className="flex min-w-0 items-center gap-2.5 sm:gap-3" aria-label={`${shopName} home`}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-gradient ring-1 ring-[#ea580c]/70 sm:h-10 sm:w-10">
        <span className="text-gradient-light font-display text-[17px] italic">{initials(shopName)}</span>
      </div>
      <div>
        <div className="font-display text-[0.95rem] uppercase leading-none tracking-[0.1em] text-primary sm:text-[1.2rem] sm:tracking-[0.16em]">{shopName}</div>
        <div className="mt-1 hidden text-[10px] uppercase tracking-[0.28em] text-tertiary sm:block">{tagline}</div>
      </div>
    </Link>
  )
}
