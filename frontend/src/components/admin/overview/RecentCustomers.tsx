import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listCustomers } from '../../../services/shop'
import { formatPlacedAt } from '../../../lib/dates'

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// Newest sign-ups.
export default function RecentCustomers() {
  const { data } = useQuery({ queryKey: ['admin', 'customers'], queryFn: listCustomers })
  const recent = (data ?? [])
    .filter((c) => c.registered && c.joinedAt)
    .sort((a, b) => b.joinedAt!.localeCompare(a.joinedAt!))
    .slice(0, 4)

  return (
    <div className="space-y-4 rounded-xl bg-surface-container-lowest p-5 shadow-sm ring-1 ring-outline-variant/30">
      <h3 className="font-display text-headline-sm text-primary">Recent Customers</h3>

      <ul className="space-y-3">
        {recent.map((c) => (
          <li key={c.id} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center text-label-md font-bold shrink-0">
              {initials(c.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-title-md text-on-surface truncate">{c.name}</p>
              <p className="text-[11px] text-secondary truncate">{c.email}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[11px] text-secondary">Joined {formatPlacedAt(c.joinedAt!).split(',')[0]}</p>
              <p className="text-[11px] text-primary font-semibold">{c.orders} {c.orders === 1 ? 'order' : 'orders'}</p>
            </div>
          </li>
        ))}
      </ul>

      <Link to="/admin/customers" className="inline-block text-label-md text-primary hover:underline">View all customers</Link>
    </div>
  )
}
