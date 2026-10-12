import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'motion/react'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { ADMIN_GROUPS, ADMIN_NAV, type AdminNavItem } from './adminNav'
import { useShop } from '../../hooks/useShop'
import { useAdminOrders, useAdminProducts } from '../../hooks/useAdminData'
import { listInquiries } from '../../services/shop'

interface AdminSidebarProps {
  open: boolean
  onClose: () => void
  shopOpen: boolean
  onToggleShop: () => void
}

export default function AdminSidebar({ open, onClose, shopOpen, onToggleShop }: AdminSidebarProps) {
  const { shopName, address } = useShop()
  const initials = shopName.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  // Live counts for the badges, so the owner sees what needs doing from any page.
  const { data: orders = [] } = useAdminOrders()
  const { data: products = [] } = useAdminProducts()
  const { data: inquiries = [] } = useQuery({ queryKey: ['admin', 'inquiries'], queryFn: listInquiries })
  const counts: Record<NonNullable<AdminNavItem['badge']>, number> = {
    pendingOrders: orders.filter((o) => o.status === 'PENDING' || o.status === 'PAYMENT_FAILED').length,
    lowStock: products.filter((p) => p.isActive && p.stock <= p.lowStockThreshold).length,
    newInquiries: inquiries.filter((q) => q.status === 'NEW').length,
  }
  // Let the owner close the mobile drawer with the Escape key.
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      {open && <div className="lg:hidden fixed inset-0 bg-black/40 z-40" onClick={onClose} aria-hidden="true" />}

      <aside
        aria-label="Owner navigation"
        className={`print:hidden fixed left-0 top-0 h-full w-72 bg-surface-container-low z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="isolate flex flex-col min-h-0">
          <div className="h-20 px-6 flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation menu"
              className="lg:hidden order-last ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-primary hover:bg-surface-container-high"
            >
              <X size={20} />
            </button>
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-display font-bold">
              {initials}
            </div>
            <div className="flex flex-col">
              <span className="font-display text-headline-sm text-primary leading-none tracking-tight">{shopName}</span>
              <span className="text-[11px] uppercase tracking-widest text-on-surface-variant mt-1">Owner Console</span>
            </div>
          </div>

          <div className="px-6 py-3 shrink-0">
            <div className="p-3 rounded-lg bg-surface-container flex flex-col gap-1">
              <span className="text-[11px] text-on-surface-variant uppercase tracking-wider">Your Shop</span>
              <span className="text-title-md text-primary">{address.split(',').slice(-2, -1)[0]?.trim() || shopName}</span>
            </div>
          </div>

          <nav className="mt-2 flex flex-col gap-5 overflow-y-auto px-4 pb-4">
            {ADMIN_GROUPS.map((group) => (
              <div key={group}>
                <p className="mb-1.5 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-outline">{group}</p>
                <ul className="flex flex-col gap-0.5">
                  {ADMIN_NAV.filter((n) => n.group === group).map(({ path, label, icon: Icon, end, badge }) => {
                    const count = badge ? counts[badge] : 0
                    return (
                      <li key={path}>
                        <NavLink
                          to={path}
                          end={end}
                          onClick={onClose}
                          className={({ isActive }) =>
                            `relative flex items-center gap-3 rounded-lg px-4 py-2.5 text-title-md transition-colors ${
                              isActive ? 'text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                            }`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              {isActive && (
                                <motion.span
                                  layoutId="admin-nav-active"
                                  className="absolute inset-0 -z-10 rounded-lg bg-primary-container shadow-sm"
                                  transition={{ type: 'spring', bounce: 0.15, visualDuration: 0.3 }}
                                />
                              )}
                              <Icon size={19} className={isActive ? 'text-[#e7c873]' : ''} />
                              <span className="flex-1">{label}</span>
                              {count > 0 && (
                                <span
                                  aria-label={`${count} need attention`}
                                  className={`min-w-6 rounded-full px-1.5 py-0.5 text-center text-[11px] font-bold ${
                                    badge === 'lowStock' ? 'bg-error text-on-error' : 'bg-[#e7c873] text-primary'
                                  }`}
                                >
                                  {count}
                                </span>
                              )}
                            </>
                          )}
                        </NavLink>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="p-4 shrink-0">
          <div className="p-3 rounded-lg bg-surface-container-lowest flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-[11px] text-on-surface-variant uppercase">Storefront</span>
              <span className="text-body-sm text-on-surface font-semibold">
                {shopOpen ? 'Accepting orders' : 'Orders paused'}
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={shopOpen}
              aria-label="Toggle accepting orders"
              onClick={onToggleShop}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${shopOpen ? 'bg-primary' : 'bg-outline-variant'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  shopOpen ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}