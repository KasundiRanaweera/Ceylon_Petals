import { Link } from 'react-router-dom'
import { useShop } from '../../hooks/useShop'

// The wordmark: the shop name in Playfair Display, in mauve (as in the Stitch design).
export default function Logo({ onClick, tone = 'dark' }: { onClick?: () => void; tone?: 'dark' | 'light' }) {
  const { shopName } = useShop()
  return (
    <Link to="/" onClick={onClick} className="flex min-h-11 min-w-0 shrink-0 items-center" aria-label={`${shopName} home`}>
      <span className={`block truncate font-display text-[1.25rem] leading-none tracking-[-0.01em] max-[339px]:text-[1.1rem] min-[380px]:text-[1.45rem] sm:text-[1.75rem] ${tone === 'light' ? 'text-white' : 'text-mauve'}`}>
        {shopName}
      </span>
    </Link>
  )
}
