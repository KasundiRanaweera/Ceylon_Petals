import { Suspense, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import AdminSidebar from './AdminSidebar'
import AdminTopbar from './AdminTopbar'
import { useShop } from '../../hooks/useShop'
import { useToast } from '../../hooks/useToast'
import { updateSettings } from '../../services/shop'

const COLLAPSED_KEY = 'cp-admin-sidebar-collapsed'

// Wraps every /admin page with the sidebar + top bar. Access is checked by <RequireRole role="OWNER"> in App.tsx.
export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // Large screens: the sidebar can shrink to a rail of icons. Remembered on this device.
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === '1'
    } catch {
      return false
    }
  })
  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    try {
      localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0')
    } catch {
      /* private mode: remembered for this visit only */
    }
  }
  const { acceptingOrders } = useShop()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const { pathname } = useLocation()

  // The switch really pauses the storefront: checkout is blocked and a banner tells customers to WhatsApp.
  const toggle = useMutation({
    mutationFn: (next: boolean) => updateSettings({ acceptingOrders: next }),
    onSuccess: (settings) => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] })
      showToast(settings.acceptingOrders ? 'The shop is taking orders again' : 'Online orders paused — customers will be asked to WhatsApp you', 'info')
    },
  })

  return (
    <div className="admin-console min-h-screen bg-background">
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        shopOpen={acceptingOrders}
        onToggleShop={() => toggle.mutate(!acceptingOrders)}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
      />
      <div className={`transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] print:pl-0 ${collapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
        <AdminTopbar onMenuClick={() => setSidebarOpen(true)} shopOpen={acceptingOrders} sidebarCollapsed={collapsed} />
        <main className="pt-20 print:pt-0">
          <div className="px-4 lg:px-8 py-8">
            <Suspense fallback={<div className="max-w-7xl mx-auto h-64 rounded-xl bg-surface-container-lowest animate-pulse" aria-busy="true" />}>
              {/* Each page eases in when the owner switches sections. */}
              <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
                <Outlet />
              </motion.div>
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}
