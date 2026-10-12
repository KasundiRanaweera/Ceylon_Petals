import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MapPin, Plus, Pencil, Trash2, Star } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { FormError, SelectField, TextField } from '../../components/ui/Field'
import { deleteAddress, listAddresses, saveAddress, type AddressInput } from '../../services/auth'
import { DISTRICTS } from '../../data/settings'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { formatPhone } from '../../lib/phone'
import type { Address } from '../../types'

const BLANK: AddressInput = { label: '', recipientName: '', phone: '', line1: '', city: '', district: 'Colombo', isDefault: false }

function AddressForm({ initial, onDone }: { initial: AddressInput; onDone: () => void }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [form, setForm] = useState<AddressInput>(initial)
  const save = useMutation({
    mutationFn: () => saveAddress(user!.id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me', 'addresses'] })
      showToast('Address saved')
      onDone()
    },
  })
  const set = <K extends keyof AddressInput>(k: K, v: AddressInput[K]) => setForm((f) => ({ ...f, [k]: v }))

  function submit(e: FormEvent) {
    e.preventDefault()
    save.mutate()
  }

  return (
    <form onSubmit={submit} className="bg-surface-container-lowest rounded-xl shadow-sm p-6 space-y-4">
      <h2 className="font-display text-headline-sm text-primary">{initial.id ? 'Edit address' : 'Add an address'}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField id="label" label="Label" placeholder="Home, Office, Amma's house" value={form.label} onChange={(e) => set('label', e.target.value)} />
        <TextField id="recipientName" label="Recipient name" required value={form.recipientName} onChange={(e) => set('recipientName', e.target.value)} />
        <TextField id="phone" label="Recipient phone" required type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        <TextField id="line1" label="Street address" required value={form.line1} onChange={(e) => set('line1', e.target.value)} />
        <TextField id="city" label="City / area" required value={form.city} onChange={(e) => set('city', e.target.value)} />
        <SelectField id="district" label="District" required value={form.district} onChange={(e) => set('district', e.target.value)}>
          {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
        </SelectField>
      </div>
      <label className="flex items-center gap-2 text-body-sm cursor-pointer">
        <input type="checkbox" checked={form.isDefault} onChange={(e) => set('isDefault', e.target.checked)} className="accent-primary w-4 h-4" />
        Use as my default address
      </label>
      <FormError message={save.error ? save.error.message : null} />
      <div className="flex gap-2">
        <button type="submit" disabled={save.isPending} className="px-5 py-2.5 rounded-lg bg-primary text-on-primary text-label-md disabled:opacity-60">
          {save.isPending ? 'Saving…' : 'Save address'}
        </button>
        <button type="button" onClick={onDone} className="px-5 py-2.5 rounded-lg bg-surface-container text-on-surface text-label-md">Cancel</button>
      </div>
    </form>
  )
}

export default function AccountAddresses() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [editing, setEditing] = useState<AddressInput | null>(null)
  const [deleting, setDeleting] = useState<Address | null>(null)
  const { data: addresses, isLoading } = useQuery({
    queryKey: ['me', 'addresses', user?.id],
    queryFn: () => listAddresses(user!.id),
    enabled: Boolean(user),
  })
  const remove = useMutation({
    mutationFn: (id: string) => deleteAddress(user!.id, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me', 'addresses'] })
      showToast('Address removed')
    },
  })

  if (editing) return <AddressForm initial={editing} onDone={() => setEditing(null)} />
  if (isLoading || !addresses) return <div className="bg-surface-container-lowest rounded-xl shadow-sm h-48 animate-pulse" aria-busy="true" />

  return (
    <div className="space-y-4">
      {addresses.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No saved addresses"
          message="Save the places you send flowers to most, and pick them in one tap at checkout."
          action={
            <button type="button" onClick={() => setEditing(BLANK)} className="px-5 py-2.5 rounded-lg bg-primary text-on-primary text-label-md">
              Add an address
            </button>
          }
        />
      ) : (
        <>
          <div className="flex justify-end">
            <button type="button" onClick={() => setEditing(BLANK)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary text-label-md">
              <Plus size={16} /> Add address
            </button>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((a) => (
              <li key={a.id} className="bg-surface-container-lowest rounded-xl shadow-sm p-5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-title-md text-primary">{a.label}</span>
                  {a.isDefault && (
                    <span className="inline-flex items-center gap-1 text-[11px] bg-primary-fixed text-on-primary-fixed px-2 py-0.5 rounded-sm">
                      <Star size={11} /> Default
                    </span>
                  )}
                </div>
                <p className="text-body-md text-on-surface">{a.recipientName}</p>
                <p className="text-body-sm text-secondary">{a.line1}, {a.city}, {a.district}</p>
                <p className="text-body-sm text-secondary">{formatPhone(a.phone)}</p>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setEditing({ ...a, phone: formatPhone(a.phone) })} className="inline-flex items-center gap-1 text-label-md text-primary hover:underline">
                    <Pencil size={14} /> Edit
                  </button>
                  <button type="button" onClick={() => setDeleting(a)} className="inline-flex items-center gap-1 text-label-md text-error hover:underline">
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      <ConfirmDialog
        open={deleting !== null}
        title="Remove this address?"
        message={deleting ? `${deleting.label} — ${deleting.line1}, ${deleting.city}` : ''}
        confirmLabel="Remove"
        cancelLabel="Keep"
        tone="danger"
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id)
          setDeleting(null)
        }}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
