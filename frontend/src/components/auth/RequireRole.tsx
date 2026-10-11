import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import type { Role } from '../../types'

// Protects a group of routes. Customers who open /admin are sent to the owner login,
// and the owner account can't use the customer account pages.
// TODO (backend): the API must check the role on every /api/admin request too — this only hides pages.
export default function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="min-h-[60vh]" aria-busy="true" />

  if (!user || user.role !== role) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={role === 'OWNER' ? `/admin/login?next=${next}` : `/sign-in?next=${next}`} replace />
  }

  return <>{children}</>
}
