import { useState, type FormEvent } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Truck, UserRound, ShoppingBag, Menu, X, LayoutDashboard, MessageCircle, PenLine } from 'lucide-react'
import Logo from './Logo'
import Ticker from './Ticker'
import ThemeToggle from './ThemeToggle'
import { SHOP_NAV } from './navLinks'
import { useCart } from '../../hooks/useCart'
import { useAuth } from '../../hooks/useAuth'
import { useShop, useWhatsApp } from '../../hooks/useShop'
import { formatPhone } from '../../lib/phone'

const EASE = [0.22, 1, 0.36, 1] as const

function SearchBox({ id, onDone, autoFocus = false, initial = '' }: { id: string; onDone?: () => void; autoFocus?: boolean; initial?: string }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState(initial)

  function submit(e: FormEvent) {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/shop?q=${encodeURIComponent(q)}` : '/shop')
    onDone?.()
  }

  return (
    <form role="search" onSubmit={submit} className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 focus-within:border-tertiary">
      <Search className="shrink-0 text-secondary" size={18} />
      <label htmlFor={id} className="sr-only">Search flowers and gifts</label>
      <input
        id={id}
        type="search"
        value={query}
        autoFocus={autoFocus}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search roses, lilies, hampers…"
        className="w-full border-0 bg-transparent py-3 text-[15px] text-on-surface placeholder:text-outline focus:outline-none"
      />
      <button type="submit" className="shrink-0 cursor-pointer text-[13px] font-semibold text-primary hover:text-tertiary">Search</button>
    </form>
  )
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { count } = useCart()
  const { user } = useAuth()
  const shop = useShop()
  const whatsapp = useWhatsApp()
  const close = () => {
    setMenuOpen(false)
    setSearchOpen(false)
  }
  // Show the current search in the box on the results page (re-mounts when the search changes).
  const [params] = useSearchParams()
  const currentQuery = params.get('q') ?? ''

  // Hide the header while scrolling down, bring it back on any scroll up. Moving it with a
  // transform (not by changing its height) means the page underneath never jumps.
  const { scrollY } = useScroll()
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  useMotionValueEvent(scrollY, 'change', (y) => {
    const previous = scrollY.getPrevious() ?? 0
    setScrolled(y > 8)
    setHidden(y > 240 && y > previous + 2)
    if (y < previous - 2) setHidden(false)
  })

  const account =
    user?.role === 'OWNER'
      ? { to: '/admin', label: 'Owner console', icon: LayoutDashboard }
      : user
        ? { to: '/account', label: user.name.split(' ')[0], icon: UserRound }
        : { to: '/sign-in', label: 'Sign in', icon: UserRound }
  const AccountIcon = account.icon
  const barLinks = SHOP_NAV.filter((l) => l.inBar !== false)


  return (
    <motion.header
      animate={{ y: hidden && !menuOpen && !searchOpen ? '-100%' : '0%' }}
      transition={{ duration: 0.3, ease: EASE }}
      className={`sticky top-0 z-50 w-full border-b bg-surface/85 backdrop-blur-xl transition-shadow duration-300 ${
        scrolled ? 'border-transparent shadow-[0_12px_30px_-20px_rgba(48,48,48,0.35)]' : 'border-outline-variant/60'
      }`}
    >
      {/* ---- Info bar: one calm, readable line ---- */}
      {shop.acceptingOrders ? (
        <div className="bg-ink text-[12.5px] tracking-[0.02em] text-[#f3f0ef]">
          <div className="mx-auto flex h-8 max-w-7xl items-center gap-6 px-4 lg:px-12">
            <Ticker />
            <div className="hidden shrink-0 items-center gap-6 md:flex">
              <a href={whatsapp('Hello! I have a question about an order.')} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-white">
                <MessageCircle size={14} className="text-[#25D366]" /> {formatPhone(shop.whatsappNumber)}
              </a>
              <Link to="/track-order" className="inline-flex items-center gap-1.5 hover:text-white">
                <Truck size={14} /> Track order
              </Link>
              <Link to="/custom-order" className="hidden items-center gap-1.5 hover:text-white lg:inline-flex">
                <PenLine size={14} /> Custom orders
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-tertiary-fixed px-4 py-2 text-center text-[13px] text-on-tertiary-fixed">
          We're not taking online orders right now.{' '}
          <a href={whatsapp('Hello! Are you taking orders today?')} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
            Message us on WhatsApp
          </a>{' '}
          and we'll help.
        </div>
      )}

      {/* ---- Main bar: logo · menu · actions ---- */}
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-6 px-4 lg:h-16 lg:px-12">
        <Logo onClick={close} />

        <nav aria-label="Shop categories" className="hidden xl:block">
          <ul className="flex items-center gap-1">
            {barLinks.map((link) => (
              <li key={link.path}>
                <NavLink
                  to={link.path}
                  className={({ isActive }) =>
                    `relative block px-3 py-2 text-[15px] tracking-[0.01em] transition-colors ${
                      isActive ? 'text-tertiary' : 'text-on-surface-variant hover:text-tertiary'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {link.short}
                      {isActive && (
                        <motion.span
                          layoutId="nav-underline"
                          className="absolute inset-x-3 -bottom-[3px] h-[1.5px] bg-[#d4af37]"
                          transition={{ type: 'spring', bounce: 0.2, visualDuration: 0.35 }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => {
              setSearchOpen((v) => !v)
              setMenuOpen(false)
            }}
            aria-expanded={searchOpen}
            aria-controls="site-search"
            aria-label={searchOpen ? 'Close search' : 'Search'}
            className="hidden h-11 w-11 cursor-pointer items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-container-low md:flex"
          >
            {searchOpen ? <X size={20} /> : <Search size={20} />}
          </button>
          <Link
            to={account.to}
            onClick={close}
            className="hidden h-11 items-center gap-2 rounded-full px-3 text-[14.5px] font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary sm:flex"
          >
            <AccountIcon size={19} />
            <span className="max-w-28 truncate">{account.label}</span>
          </Link>
          <Link
            to="/cart"
            onClick={close}
            aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}
            className="btn-gradient ml-1 flex h-11 items-center gap-2 px-5 text-[14px]"
          >
            <ShoppingBag size={18} />
            <span className="hidden sm:inline">Cart</span>
            <motion.span
              key={count}
              initial={{ scale: count > 0 ? 1.6 : 1 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5, visualDuration: 0.35 }}
              className="min-w-5 rounded-full bg-ink px-1.5 py-0.5 text-center text-[11px] font-bold text-white"
            >
              {count}
            </motion.span>
          </Link>
          <button
            type="button"
            onClick={() => {
              setMenuOpen((v) => !v)
              setSearchOpen(false)
            }}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-primary hover:bg-surface-container-low xl:hidden"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* ---- Desktop search drawer ---- */}
      <AnimatePresence initial={false}>
        {searchOpen && (
          <motion.div
            key="site-search"
            id="site-search"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            style={{ overflow: 'hidden' }}
            className="border-t border-outline-variant bg-surface"
          >
            <div className="mx-auto max-w-3xl px-4 py-4">
              <SearchBox key={currentQuery} id="search-desktop" initial={currentQuery} onDone={close} autoFocus />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Mobile / tablet menu ---- */}
      <AnimatePresence initial={false}>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            id="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            style={{ overflow: 'hidden' }}
            className="border-t border-outline-variant bg-surface xl:hidden"
          >
            <div className="max-h-[calc(100vh-7rem)] overflow-y-auto">
              <div className="space-y-4 px-4 py-4">
                <div className="md:hidden">
                  <SearchBox key={currentQuery} id="search-mobile" initial={currentQuery} onDone={close} />
                </div>
                <nav aria-label="Mobile" className="grid grid-cols-1 gap-0.5 sm:grid-cols-2">
                  {SHOP_NAV.map((link) => (
                    <NavLink
                      key={link.path}
                      to={link.path}
                      onClick={close}
                      className={({ isActive }) =>
                        `rounded-lg px-3 py-3 text-[16px] ${isActive ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-surface-container-low'}`
                      }
                    >
                      {link.label}
                    </NavLink>
                  ))}
                </nav>
                <div className="grid grid-cols-2 gap-2 border-t border-outline-variant pt-4">
                  <Link to="/track-order" onClick={close} className="flex items-center justify-center gap-2 rounded-sm bg-surface-container-low px-3 py-3 text-[14px] font-medium text-primary">
                    <Truck size={16} /> Track order
                  </Link>
                  <Link to={account.to} onClick={close} className="flex items-center justify-center gap-2 rounded-sm bg-surface-container-low px-3 py-3 text-[14px] font-medium text-primary">
                    <AccountIcon size={16} /> {account.label}
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
