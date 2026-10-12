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
      <div className="max-w-7xl mx-auto w-full px-4 lg:px-12 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <nav aria-label="Account" className="lg:col-span-3 bg-surface-container-lowest rounded-2xl shadow-sm p-2 flex lg:flex-col gap-1 overflow-x-auto">
          {TABS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-title-md whitespace-nowrap transition-colors ${
                  isActive ? 'text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-low'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="account-tab"
                      className="absolute inset-0 rounded-xl bg-primary-container"
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
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-title-md text-error hover:bg-error-container/40 whitespace-nowrap"
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
