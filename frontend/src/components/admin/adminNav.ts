import {
  LayoutDashboard,
  ClipboardList,
  Package,
  Tags,
  Boxes,
  Users,
  MessageSquareText,
  Star,
  TrendingUp,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface AdminNavItem {
  path: string
  label: string
  icon: LucideIcon
  end?: boolean
  /** Sidebar heading this link sits under. */
  group: 'Sell' | 'Catalogue' | 'People' | 'Insights'
  /** Live count shown as a badge (see AdminSidebar). */
  badge?: 'pendingOrders' | 'lowStock' | 'newInquiries'
}

// One list drives the sidebar groups and the page title in the top bar.
export const ADMIN_NAV: AdminNavItem[] = [
  { path: '/admin', label: 'Overview', icon: LayoutDashboard, end: true, group: 'Sell' },
  { path: '/admin/orders', label: 'Orders', icon: ClipboardList, group: 'Sell', badge: 'pendingOrders' },
  { path: '/admin/products', label: 'Products', icon: Package, group: 'Catalogue' },
  { path: '/admin/categories', label: 'Categories', icon: Tags, group: 'Catalogue' },
  { path: '/admin/inventory', label: 'Inventory', icon: Boxes, group: 'Catalogue', badge: 'lowStock' },
  { path: '/admin/customers', label: 'Customers', icon: Users, group: 'People' },
  { path: '/admin/inquiries', label: 'Custom Inquiries', icon: MessageSquareText, group: 'People', badge: 'newInquiries' },
  { path: '/admin/reviews', label: 'Reviews', icon: Star, group: 'People' },
  { path: '/admin/analytics', label: 'Analytics', icon: TrendingUp, group: 'Insights' },
  { path: '/admin/settings', label: 'Settings', icon: Settings, group: 'Insights' },
]

export const ADMIN_GROUPS = ['Sell', 'Catalogue', 'People', 'Insights'] as const

/** The nav entry for the current path (longest match), for the top-bar title. */
export function currentAdminPage(pathname: string): AdminNavItem | undefined {
  return [...ADMIN_NAV]
    .sort((a, b) => b.path.length - a.path.length)
    .find((n) => (n.end ? pathname === n.path : pathname.startsWith(n.path)))
}