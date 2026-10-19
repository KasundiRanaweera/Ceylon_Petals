import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Package, MapPin, UserCog, LogOut } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { useAuth } from '../../hooks/useAuth'

const TABS = [
  { to: '/account/orders', label: 'My orders', icon: Package },
  { to: '/account/addresses', label: 'Saved addresses', icon: MapPin },
  { to: '/account/profile', label: 'Profile', icon: UserCog },
]

export default function AccountLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="flex flex-col w-full">
      <PageHeader
        eyebrow="My account"
        title={`Hello, ${user?.name.split(' ')[0] ?? ''}`}
        subtitle="Follow your orders, and keep addresses ready for faster checkout."
        breadcrumbs={[{ label: 'My account' }]}
      />
      <div className="max-w-7xl mx-auto w-full px-4 lg:px-12 py-10 lg:py-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <nav aria-label="Account" className="lg:col-span-3 rounded-xl bg-surface-container-lowest ring-1 ring-outline-variant/40 shadow-[0_18px_40px_-28px_rgba(48,48,48,0.35)] p-3 flex lg:flex-col gap-1 overflow-x-auto">
          {TABS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `relative flex min-h-11 items-center gap-3 px-4 py-2.5 rounded-lg text-label-md whitespace-nowrap transition-colors ${
                  isActive ? 'text-white' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="account-tab"
                      className="absolute inset-0 rounded-lg bg-primary"
                      transition={{ type: 'spring', bounce: 0.15, visualDuration: 0.35 }}
                    />
                  )}
                  <Icon size={18} className="relative" /> <span className="relative">{label}</span>
                </>
              )}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={handleSignOut}
            className="flex min-h-11 items-center gap-3 px-4 py-2.5 rounded-lg text-label-md text-error hover:bg-error-container/40 whitespace-nowrap"
          >
            <LogOut size={18} /> Sign out
          </button>
        </nav>
        <div className="lg:col-span-9">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
