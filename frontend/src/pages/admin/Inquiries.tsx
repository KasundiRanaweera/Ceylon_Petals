import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageCircle, Mail, Phone, Inbox, CalendarDays, MapPin } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import EmptyState from '../../components/ui/EmptyState'
import { listInquiries, updateInquiry } from '../../services/shop'
import { useShop } from '../../hooks/useShop'
import { useToast } from '../../hooks/useToast'
import { buildWhatsAppLink } from '../../lib/whatsapp'
import { formatLongDate, formatPlacedAt } from '../../lib/dates'
import { formatPhone } from '../../lib/phone'
import type { Inquiry, InquiryStatus, InquiryType } from '../../types'

const TYPE_LABEL: Record<InquiryType, string> = { WEDDING: 'Wedding', BULK: 'Bulk order', CORPORATE: 'Corporate', CUSTOM: 'Custom design' }
const STATUS_LABEL: Record<InquiryStatus, string> = { NEW: 'New', CONTACTED: 'Contacted', QUOTED: 'Quote sent', CONFIRMED: 'Confirmed', CLOSED: 'Closed' }
const STATUS_STYLE: Record<InquiryStatus, string> = {
  NEW: 'bg-tertiary-fixed text-on-tertiary-fixed',
  CONTACTED: 'bg-secondary-container text-on-secondary-container',
  QUOTED: 'bg-primary-fixed text-on-primary-fixed',
  CONFIRMED: 'bg-emerald-100 text-emerald-800',
  CLOSED: 'bg-surface-container-high text-on-surface-variant',
}
const STATUSES = Object.keys(STATUS_LABEL) as InquiryStatus[]

function InquiryPanel({ inquiry }: { inquiry: Inquiry }) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const { shopName } = useShop()
  const [notes, setNotes] = useState(inquiry.ownerNotes ?? '')
  const update = useMutation({
    mutationFn: (changes: { status?: InquiryStatus; ownerNotes?: string }) => updateInquiry(inquiry.id, changes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'inquiries'] })
      showToast('Inquiry updated')
    },
  })

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-[11px] uppercase tracking-wider text-secondary">{TYPE_LABEL[inquiry.type]} · {inquiry.reference}</span>
          <h2 className="font-display text-headline-md text-primary">{inquiry.name}</h2>
          <p className="text-body-sm text-secondary">Received {formatPlacedAt(inquiry.createdAt)}</p>
        </div>
        <label className="flex items-center gap-2 text-label-md">
          <span className="text-secondary">Status</span>
          <select
            value={inquiry.status}
            onChange={(e) => update.mutate({ status: e.target.value as InquiryStatus })}
            className={`rounded-lg px-2 py-1.5 border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary ${STATUS_STYLE[inquiry.status]}`}
          >
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href={buildWhatsAppLink(`Hello ${inquiry.name.split(' ')[0]}, this is ${shopName} about your request ${inquiry.reference}.`, inquiry.phone)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 bg-[#25D366] text-white text-label-md px-3 py-2 rounded-lg"
        >
          <MessageCircle size={15} /> WhatsApp {formatPhone(inquiry.phone)}
        </a>
        <a href={`tel:+${inquiry.phone}`} className="inline-flex items-center gap-1.5 bg-surface-container text-primary text-label-md px-3 py-2 rounded-lg"><Phone size={15} /> Call</a>
        <a href={`mailto:${inquiry.email}?subject=${encodeURIComponent(`Your request ${inquiry.reference}`)}`} className="inline-flex items-center gap-1.5 bg-surface-container text-primary text-label-md px-3 py-2 rounded-lg">
          <Mail size={15} /> {inquiry.email}
        </a>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-body-md">
        {inquiry.eventDate && (
          <div className="flex gap-2"><CalendarDays size={17} className="text-primary mt-0.5" /><div><dt className="text-[11px] uppercase text-secondary">Date</dt><dd>{formatLongDate(inquiry.eventDate)}</dd></div></div>
        )}
        {inquiry.location && (
          <div className="flex gap-2"><MapPin size={17} className="text-primary mt-0.5" /><div><dt className="text-[11px] uppercase text-secondary">Venue / city</dt><dd>{inquiry.location}</dd></div></div>
        )}
        {inquiry.quantity && <div><dt className="text-[11px] uppercase text-secondary">Quantity</dt><dd>{inquiry.quantity}</dd></div>}
        {inquiry.budget && <div><dt className="text-[11px] uppercase text-secondary">Budget</dt><dd>{inquiry.budget}</dd></div>}
        {Object.entries(inquiry.extra ?? {}).map(([k, v]) => (
          <div key={k}><dt className="text-[11px] uppercase text-secondary">{k}</dt><dd>{v}</dd></div>
        ))}
      </dl>

      <div className="bg-surface-container-low rounded-lg p-4">
        <p className="text-[11px] uppercase tracking-wider text-secondary mb-1">Their request</p>
        <p className="text-body-md text-on-surface whitespace-pre-wrap">{inquiry.details}</p>
      </div>

      <div className="space-y-2">
        <label htmlFor={`notes-${inquiry.id}`} className="block text-label-md text-primary">Your notes (only you see these)</label>
        <textarea
          id={`notes-${inquiry.id}`}
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Quoted Rs. 58,000 on WhatsApp, follow up Friday"
          className="w-full bg-surface-container-low rounded-lg p-3 text-body-md focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="button"
          disabled={notes === (inquiry.ownerNotes ?? '') || update.isPending}
          onClick={() => update.mutate({ ownerNotes: notes })}
          className="px-4 py-2 rounded-lg bg-primary text-on-primary text-label-md disabled:opacity-40"
        >
          Save notes
        </button>
      </div>
    </div>
  )
}

export default function Inquiries() {
  const { data: inquiries = [], isLoading } = useQuery({ queryKey: ['admin', 'inquiries'], queryFn: listInquiries })
  const [status, setStatus] = useState<'OPEN' | 'ALL' | InquiryStatus>('OPEN')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = inquiries.filter((i) =>
    status === 'ALL' ? true : status === 'OPEN' ? i.status !== 'CLOSED' && i.status !== 'CONFIRMED' : i.status === status
  )
  const selected = filtered.find((i) => i.id === selectedId) ?? filtered[0]

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <AdminPageHeader eyebrow="Requests" title="Custom Inquiries" subtitle="Wedding, bulk, corporate and custom-design requests from the website." />

      <div className="flex items-center gap-2 overflow-x-auto relative pb-1">
        {(['OPEN', 'ALL', ...STATUSES] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`px-3 py-1 rounded-sm text-label-md whitespace-nowrap ${status === s ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'}`}
          >
            {s === 'OPEN' ? 'Open' : s === 'ALL' ? 'All' : STATUS_LABEL[s]} (
            {inquiries.filter((i) => (s === 'ALL' ? true : s === 'OPEN' ? i.status !== 'CLOSED' && i.status !== 'CONFIRMED' : i.status === s)).length})
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="bg-surface-container-lowest rounded-xl h-64 animate-pulse" aria-busy="true" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Inbox} title="No inquiries here" message="New requests from the Custom Order and Weddings pages will appear here." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <ul className="bg-surface-container-lowest rounded-xl shadow-sm divide-y divide-surface-container lg:max-h-[70vh] overflow-y-auto">
            {filtered.map((i) => (
              <li key={i.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(i.id)}
                  aria-current={selected?.id === i.id}
                  className={`w-full text-left p-4 space-y-1 transition-colors ${selected?.id === i.id ? 'bg-primary-fixed/40' : 'hover:bg-surface-container-low'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-title-md text-primary truncate">{i.name}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded font-semibold shrink-0 ${STATUS_STYLE[i.status]}`}>{STATUS_LABEL[i.status]}</span>
                  </div>
                  <p className="text-body-sm text-secondary">{TYPE_LABEL[i.type]} · {formatPlacedAt(i.createdAt)}</p>
                  <p className="text-body-sm text-on-surface-variant line-clamp-2">{i.details}</p>
                </button>
              </li>
            ))}
          </ul>
          <div className="lg:col-span-2">{selected && <InquiryPanel key={selected.id} inquiry={selected} />}</div>
        </div>
      )}
    </div>
  )
}
