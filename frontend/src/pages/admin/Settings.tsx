import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import { FormError, TextField } from '../../components/ui/Field'
import { getAdminSettings, updateSettings } from '../../services/shop'
import { DISTRICTS } from '../../data/settings'
import { useToast } from '../../hooks/useToast'
import { formatPhone } from '../../lib/phone'
import type { DeliveryZone, PromoCode, ShopSettings } from '../../types'

// Rows in the zone and promo tables need a key while they are being edited; the server identifies them by district / code.
let rowCounter = 0
const newId = (prefix: string) => `${prefix}-new-${++rowCounter}`

const section = 'bg-surface-container-lowest rounded-xl shadow-sm p-6 space-y-4'
const cell = 'bg-surface-container-low rounded-lg px-2.5 py-1.5 text-body-sm focus:outline-none focus:ring-1 focus:ring-primary'

export default function Settings() {
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'settings'], queryFn: getAdminSettings })
  if (isLoading || !data) return <div className="max-w-5xl mx-auto bg-surface-container-lowest rounded-xl h-96 animate-pulse" aria-busy="true" />
  return <SettingsForm initial={data} />
}

function SettingsForm({ initial }: { initial: ShopSettings }) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [form, setForm] = useState<ShopSettings>({ ...initial, whatsappNumber: formatPhone(initial.whatsappNumber) })
  const set = <K extends keyof ShopSettings>(k: K, v: ShopSettings[K]) => setForm((f) => ({ ...f, [k]: v }))

  const save = useMutation({
    mutationFn: () => updateSettings(form),
    onSuccess: (saved) => {
      queryClient.setQueryData(['admin', 'settings'], saved)
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      setForm({ ...saved, whatsappNumber: formatPhone(saved.whatsappNumber) })
      showToast('Settings saved — the shop is updated')
    },
  })
  function updateZone(id: string, changes: Partial<DeliveryZone>) {
    set('deliveryZones', form.deliveryZones.map((z) => (z.id === id ? { ...z, ...changes } : z)))
  }
  function updatePromo(id: string, changes: Partial<PromoCode>) {
    set('promoCodes', form.promoCodes.map((p) => (p.id === id ? { ...p, ...changes } : p)))
  }
  const unusedDistricts = DISTRICTS.filter((d) => !form.deliveryZones.some((z) => z.district === d))

  function submit(e: FormEvent) {
    e.preventDefault()
    save.mutate()
  }

  return (
    <form onSubmit={submit} className="max-w-5xl mx-auto space-y-6">
      <AdminPageHeader
        eyebrow="Shop"
        title="Settings"
        subtitle="Changes show on the website straight away."
        actions={
          <button type="submit" disabled={save.isPending} className="bg-primary text-on-primary px-5 py-2 rounded-lg text-label-md hover:bg-primary-container disabled:opacity-60">
            {save.isPending ? 'Saving…' : 'Save settings'}
          </button>
        }
      />
      <FormError message={save.error ? save.error.message : null} />

      <section className={section}>
        <h2 className="font-display text-headline-sm text-primary">Shop details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField id="shopName" label="Shop name" required value={form.shopName} onChange={(e) => set('shopName', e.target.value)} />
          <TextField id="tagline" label="Tagline" value={form.tagline} onChange={(e) => set('tagline', e.target.value)} />
          <TextField id="whatsappNumber" label="WhatsApp number" required type="tel" hint="Every “Order on WhatsApp” button sends customers here." value={form.whatsappNumber} onChange={(e) => set('whatsappNumber', e.target.value)} />
          <TextField id="phone" label="Phone (for calls)" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          <TextField id="email" label="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          <TextField id="openingHours" label="Opening hours" value={form.openingHours} onChange={(e) => set('openingHours', e.target.value)} />
          <TextField id="address" label="Studio address" className="sm:col-span-2" value={form.address} onChange={(e) => set('address', e.target.value)} />
        </div>
      </section>

      <section className={section}>
        <div>
          <h2 className="font-display text-headline-sm text-primary">Storefront</h2>
          <p className="text-body-sm text-secondary">What customers see on every page of the website.</p>
        </div>
        <TextField
          id="announcement"
          label="Announcement bar"
          maxLength={160}
          placeholder="e.g. Avurudu hampers are here: order by 10 April"
          hint={`${form.announcement.length}/160. Shown at the top of every page. Leave empty to show the same-day delivery message automatically.`}
          value={form.announcement}
          onChange={(e) => set('announcement', e.target.value)}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TextField id="instagramUrl" label="Instagram link" type="url" placeholder="https://instagram.com/yourshop" value={form.instagramUrl} onChange={(e) => set('instagramUrl', e.target.value)} />
          <TextField id="facebookUrl" label="Facebook link" type="url" placeholder="https://facebook.com/yourshop" value={form.facebookUrl} onChange={(e) => set('facebookUrl', e.target.value)} />
          <TextField id="tiktokUrl" label="TikTok link" type="url" placeholder="https://tiktok.com/@yourshop" value={form.tiktokUrl} onChange={(e) => set('tiktokUrl', e.target.value)} />
        </div>
        <p className="text-body-sm text-secondary">Links you fill in appear in the website footer. Leave a box empty to hide it.</p>
      </section>

      <section className={section}>
        <h2 className="font-display text-headline-sm text-primary">Ordering</h2>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={form.acceptingOrders} onChange={(e) => set('acceptingOrders', e.target.checked)} className="accent-primary w-4 h-4 mt-1" />
          <span>
            <span className="block text-title-md text-on-surface">Accept online orders</span>
            <span className="block text-body-sm text-secondary">Turn off on holidays or busy days — customers will be asked to WhatsApp you instead.</span>
          </span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField id="sameDayCutoff" label="Same-day cut-off time" type="time" value={form.sameDayCutoff} onChange={(e) => set('sameDayCutoff', e.target.value)} />
          <TextField id="freeDeliveryOver" label="Free delivery on orders over (Rs.)" type="number" min={0} hint="Set 0 to turn off free delivery." value={String(form.freeDeliveryOver)} onChange={(e) => set('freeDeliveryOver', Number(e.target.value) || 0)} />
        </div>
      </section>

      <section className={section}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-headline-sm text-primary">Delivery zones & fees</h2>
          {unusedDistricts.length > 0 && (
            <button
              type="button"
              onClick={() => set('deliveryZones', [...form.deliveryZones, { id: newId('z'), district: unusedDistricts[0], fee: 1500, sameDay: false, active: true }])}
              className="inline-flex items-center gap-1 text-label-md text-primary hover:underline"
            >
              <Plus size={15} /> Add district
            </button>
          )}
        </div>
        <p className="text-body-sm text-secondary">Customers can only check out to active districts. Others are asked to order on WhatsApp.</p>
        <div className="overflow-x-auto relative">
          <table className="w-full text-left min-w-[560px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-secondary">
                <th className="py-2 pr-3 font-semibold">District</th>
                <th className="py-2 pr-3 font-semibold">Fee (Rs.)</th>
                <th className="py-2 pr-3 font-semibold">Same-day</th>
                <th className="py-2 pr-3 font-semibold">Active</th>
                <th className="py-2 font-semibold"><span className="sr-only">Remove</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {form.deliveryZones.map((z) => (
                <tr key={z.id}>
                  <td className="py-2 pr-3">
                    <select aria-label="District" value={z.district} onChange={(e) => updateZone(z.id, { district: e.target.value })} className={cell}>
                      {[z.district, ...unusedDistricts].map((d) => <option key={d}>{d}</option>)}
                    </select>
                  </td>
                  <td className="py-2 pr-3">
                    <input aria-label={`Fee for ${z.district}`} type="number" min={0} value={z.fee} onChange={(e) => updateZone(z.id, { fee: Number(e.target.value) || 0 })} className={`${cell} w-28`} />
                  </td>
                  <td className="py-2 pr-3">
                    <input aria-label={`Same-day delivery to ${z.district}`} type="checkbox" checked={z.sameDay} onChange={(e) => updateZone(z.id, { sameDay: e.target.checked })} className="accent-primary w-4 h-4" />
                  </td>
                  <td className="py-2 pr-3">
                    <input aria-label={`Deliver to ${z.district}`} type="checkbox" checked={z.active} onChange={(e) => updateZone(z.id, { active: e.target.checked })} className="accent-primary w-4 h-4" />
                  </td>
                  <td className="py-2 text-right">
                    <button type="button" onClick={() => set('deliveryZones', form.deliveryZones.filter((x) => x.id !== z.id))} aria-label={`Remove ${z.district}`} className="w-8 h-8 rounded-lg text-error hover:bg-error-container inline-flex items-center justify-center">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={section}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-headline-sm text-primary">Promo codes</h2>
          <button
            type="button"
            onClick={() => set('promoCodes', [...form.promoCodes, { id: newId('promo'), code: '', type: 'PERCENT', value: 10, minOrder: 0, active: true, description: '' }])}
            className="inline-flex items-center gap-1 text-label-md text-primary hover:underline"
          >
            <Plus size={15} /> Add code
          </button>
        </div>
        {form.promoCodes.length === 0 ? (
          <p className="text-body-sm text-secondary">No promo codes yet.</p>
        ) : (
          <div className="overflow-x-auto relative">
            <table className="w-full text-left min-w-[720px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-secondary">
                  <th className="py-2 pr-3 font-semibold">Code</th>
                  <th className="py-2 pr-3 font-semibold">Discount</th>
                  <th className="py-2 pr-3 font-semibold">Min. order (Rs.)</th>
                  <th className="py-2 pr-3 font-semibold">Note</th>
                  <th className="py-2 pr-3 font-semibold">Active</th>
                  <th className="py-2 font-semibold"><span className="sr-only">Remove</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {form.promoCodes.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 pr-3">
                      <input aria-label="Code" value={p.code} placeholder="CODE" onChange={(e) => updatePromo(p.id, { code: e.target.value.toUpperCase() })} className={`${cell} w-32 uppercase`} />
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex gap-1">
                        <input aria-label="Amount" type="number" min={0} value={p.value} onChange={(e) => updatePromo(p.id, { value: Number(e.target.value) || 0 })} className={`${cell} w-20`} />
                        <select aria-label="Discount type" value={p.type} onChange={(e) => updatePromo(p.id, { type: e.target.value as PromoCode['type'] })} className={cell}>
                          <option value="PERCENT">%</option>
                          <option value="FIXED">Rs.</option>
                        </select>
                      </div>
                    </td>
                    <td className="py-2 pr-3">
                      <input aria-label="Minimum order" type="number" min={0} value={p.minOrder} onChange={(e) => updatePromo(p.id, { minOrder: Number(e.target.value) || 0 })} className={`${cell} w-28`} />
                    </td>
                    <td className="py-2 pr-3">
                      <input aria-label="Note" value={p.description} placeholder="e.g. Avurudu offer" onChange={(e) => updatePromo(p.id, { description: e.target.value })} className={`${cell} w-full`} />
                    </td>
                    <td className="py-2 pr-3">
                      <input aria-label={`${p.code || 'Code'} active`} type="checkbox" checked={p.active} onChange={(e) => updatePromo(p.id, { active: e.target.checked })} className="accent-primary w-4 h-4" />
                    </td>
                    <td className="py-2 text-right">
                      <button type="button" onClick={() => set('promoCodes', form.promoCodes.filter((x) => x.id !== p.id))} aria-label={`Remove ${p.code || 'code'}`} className="w-8 h-8 rounded-lg text-error hover:bg-error-container inline-flex items-center justify-center">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </form>
  )
}
