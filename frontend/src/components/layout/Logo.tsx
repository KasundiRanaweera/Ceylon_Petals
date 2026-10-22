import { Link } from 'react-router-dom'
import { useShop } from '../../hooks/useShop'

// The wordmark: the shop name in Playfair Display, in mauve (as in the Stitch design).
export default function Logo({ onClick, tone = 'dark' }: { onClick?: () => void; tone?: 'dark' | 'light' }) {
  const { shopName } = useShop()
  return (
    <Link to="/" onClick={onClick} className="block min-w-0 shrink-0" aria-label={`${shopName} home`}>
      <span className={`block truncate font-display text-[1.25rem] leading-none tracking-[-0.01em] min-[360px]:text-[1.45rem] sm:text-[1.75rem] ${tone === 'light' ? 'text-white' : 'text-mauve'}`}>
        {shopName}
      </span>
    </Link>
  )
}
