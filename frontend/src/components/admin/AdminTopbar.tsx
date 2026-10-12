import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, Globe, Store, LogOut, LayoutDashboard } from 'lucide-react'
import { currentAdminPage } from './adminNav'
import { useAuth } from '../../hooks/useAuth'

interface AdminTopbarProps {
  onMenuClick: () => void
  shopOpen: boolean
}

// Live Colombo clock, refreshed every 30 seconds.
function useColomboTime() {
  const [time, setTime] = useState('')
  useEffect(() => {
    function update() {
      setTime(
        new Intl.DateTimeFormat('en-GB', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Colombo',
        }).format(new Date())
      )
    }
    update()
    const id = setInterval(update, 30000)
    return () => clearInterval(id)
  }, [])
  return time
}

export default function AdminTopbar({ onMenuClick, shopOpen }: AdminTopbarProps) {
  const time = useColomboTime()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const page = currentAdminPage(useLocation().pathname)
  const PageIcon = page?.icon ?? LayoutDashboard

  async function handleSignOut() {
    await signOut()
    navigate('/admin/login')
  }

  return (
    <header className="print:hidden fixed top-0 left-0 lg:left-72 right-0 h-20 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-30">
      <div className="w-full h-20 px-4 lg:px-8 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
            className="lg:hidden w-10 h-10 rounded-lg bg-surface-container-low text-primary flex items-center justify-center"
          >
            <Menu size={22} />
          </button>
          <div className="flex min-w-0 items-center gap-2 text-primary">
            <PageIcon size={20} className="shrink-0 text-tertiary" />
            <span className="truncate font-display text-headline-sm text-primary">{page?.label ?? 'Owner Dashboard'}</span>
          </div>
          <div className="hidden md:block h-4 w-px bg-outline-variant mx-1" />
          <div
            className={`hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-sm text-label-md ${
              shopOpen ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-tertiary-fixed text-on-tertiary-fixed'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${shopOpen ? 'bg-emerald-600' : 'bg-tertiary'}`} />
            <span>{shopOpen ? 'Accepting Orders' : 'Orders Paused'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 lg:gap-5">
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface text-label-md">
            <Globe size={16} className="text-on-surface-variant" />
            <span>Colombo • {time}</span>
          </div>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-high text-primary hover:bg-primary-container hover:text-on-primary transition-colors text-title-md"
          >
            <Store size={18} />
            <span className="hidden sm:inline">View Storefront</span>
          </a>
          <div className="hidden sm:block h-5 w-px bg-outline-variant" />
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-title-md text-primary leading-tight">{user?.name ?? 'Owner'}</span>
              <span className="text-[11px] text-on-surface-variant">Shop owner</span>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              title="Sign out"
              aria-label="Sign out"
              className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center hover:bg-primary-container"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}