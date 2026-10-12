import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, MessageCircle, Download, Mail } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import { listCustomers } from '../../services/shop'
import { useShop } from '../../hooks/useShop'
import { useToast } from '../../hooks/useToast'
import { buildWhatsAppLink } from '../../lib/whatsapp'
import { formatLKR } from '../../lib/format'
import { formatPlacedAt, isoDate } from '../../lib/dates'
import { formatPhone } from '../../lib/phone'
import { downloadCsv } from '../../lib/exportCsv'

type Filter = 'all' | 'registered' | 'guest' | 'repeat'
type Sort = 'recent' | 'spent' | 'orders'

export default function Customers() {
  const { shopName } = useShop()
  const { showToast } = useToast()
  const { data: customers = [], isLoading } = useQuery({ queryKey: ['admin', 'customers'], queryFn: listCustomers })
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('recent')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = customers.filter((c) => {
      if (filter === 'registered' && !c.registered) return false
      if (filter === 'guest' && c.registered) return false
      if (filter === 'repeat' && c.orders < 2) return false
      return !q || [c.name, c.email ?? '', c.phone].some((v) => v.toLowerCase().includes(q))
    })
    return list.sort((a, b) =>
      sort === 'spent' ? b.totalSpent - a.totalSpent : sort === 'orders' ? b.orders - a.orders : (b.lastOrderAt ?? b.joinedAt ?? '').localeCompare(a.lastOrderAt ?? a.joinedAt ?? '')
    )
  }, [customers, query, filter, sort])

  function exportList() {
    downloadCsv(`customers-${isoDate(0)}.csv`, [
      ['Name', 'Email', 'Phone', 'Account', 'Orders', 'Total spent (LKR)', 'Last order'],
      ...rows.map((c) => [c.name, c.email ?? '', formatPhone(c.phone), c.registered ? 'Registered' : 'Guest', c.orders, c.totalSpent, c.lastOrderAt ? formatPlacedAt(c.lastOrderAt) : '']),
    ])
    showToast(`Exported ${rows.length} customers`)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <AdminPageHeader
        eyebrow="People"
        title="Customers"
        subtitle="Registered accounts and guests who have ordered, matched by phone number."
        actions={
          <button type="button" onClick={exportList} disabled={rows.length === 0} className="inline-flex items-center gap-2 bg-surface-container-high text-primary px-4 py-2 rounded-lg text-label-md hover:bg-primary hover:text-on-primary disabled:opacity-50">
            <Download size={16} /> Export
          </button>
        }
      />

      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-4 flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
        <div className="relative lg:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, email or phone..." aria-label="Search customers" className="w-full bg-surface-container-low rounded-lg py-2 pl-9 pr-3 text-body-sm focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', 'registered', 'guest', 'repeat'] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-sm text-label-md ${filter === f ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'}`}
            >
              {{ all: 'All', registered: 'Registered', guest: 'Guests', repeat: 'Repeat customers' }[f]}
            </button>
          ))}
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort customers" className="bg-surface-container-low text-label-md rounded-lg px-3 py-1.5 focus:outline-none">
            <option value="recent">Most recent</option>
            <option value="spent">Highest spend</option>
            <option value="orders">Most orders</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-surface-container-lowest rounded-xl h-64 animate-pulse" aria-busy="true" />
      ) : (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-x-auto relative">
          <table className="w-full text-left min-w-[760px]">
            <thead>
              <tr className="bg-surface-container-low text-[11px] uppercase tracking-wider text-secondary">
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Orders</th>
                <th className="px-4 py-3 font-semibold" title="Total of paid orders">Paid so far</th>
                <th className="px-4 py-3 font-semibold">Last order</th>
                <th className="px-4 py-3 font-semibold">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-surface-container-low/50">
                  <td className="px-4 py-3">
                    <span className="block text-title-md text-on-surface">{c.name}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded ${c.registered ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-surface-container text-secondary'}`}>
                      {c.registered ? `Account since ${formatPlacedAt(c.joinedAt!).split(',')[0]}` : 'Guest'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-body-sm">
                    <span className="block">{formatPhone(c.phone)}</span>
                    {c.email && <span className="block text-secondary">{c.email}</span>}
                  </td>
                  <td className="px-4 py-3 text-title-md text-primary">{c.orders}</td>
                  <td className="px-4 py-3 text-currency-md text-primary">{formatLKR(c.totalSpent)}</td>
                  <td className="px-4 py-3 text-body-sm text-secondary">{c.lastOrderAt ? formatPlacedAt(c.lastOrderAt) : 'No orders yet'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <a
                        href={buildWhatsAppLink(`Hello ${c.name.split(' ')[0]}, this is ${shopName}.`, c.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`WhatsApp ${c.name}`}
                        title="WhatsApp"
                        className="w-8 h-8 rounded-lg bg-surface-container-low text-[#25D366] hover:bg-[#25D366] hover:text-white flex items-center justify-center"
                      >
                        <MessageCircle size={16} />
                      </a>
                      {c.email && (
                        <a href={`mailto:${c.email}`} aria-label={`Email ${c.name}`} title="Email" className="w-8 h-8 rounded-lg bg-surface-container-low text-primary hover:bg-primary hover:text-on-primary flex items-center justify-center">
                          <Mail size={16} />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="text-center text-body-sm text-secondary py-10">No customers match.</p>}
        </div>
      )}
    </div>
  )
}
