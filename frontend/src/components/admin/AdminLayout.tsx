import { Suspense, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import AdminSidebar from './AdminSidebar'
import AdminTopbar from './AdminTopbar'
import { useShop } from '../../hooks/useShop'
import { useToast } from '../../hooks/useToast'
import { updateSettings } from '../../services/shop'

// Wraps every /admin page with the sidebar + top bar. Access is checked by <RequireRole role="OWNER"> in App.tsx.
export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { acceptingOrders } = useShop()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const { pathname } = useLocation()

  // The switch really pauses the storefront: checkout is blocked and a banner tells customers to WhatsApp.
  const toggle = useMutation({
    mutationFn: (next: boolean) => updateSettings({ acceptingOrders: next }),
    onSuccess: (settings) => {
      queryClient.setQueryData(['settings'], settings)
      showToast(settings.acceptingOrders ? 'The shop is taking orders again' : 'Online orders paused — customers will be asked to WhatsApp you', 'info')
    },
  })

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        shopOpen={acceptingOrders}
        onToggleShop={() => toggle.mutate(!acceptingOrders)}
      />
      <div className="lg:pl-72 print:pl-0">
        <AdminTopbar onMenuClick={() => setSidebarOpen(true)} shopOpen={acceptingOrders} />
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
