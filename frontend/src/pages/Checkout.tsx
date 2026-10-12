import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ShoppingBag, CreditCard, Banknote, MessageCircle, Lock, Tag } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import { FormError, SelectField, TextAreaField, TextField } from '../components/ui/Field'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'
import { useShop } from '../hooks/useShop'
import { createOrder, quoteOrder } from '../services/orders'
import { listAddresses, saveAddress } from '../services/auth'
import { DISTRICTS } from '../data/settings'
import { availableSlots, earliestDeliveryDate } from '../lib/deliverySlots'
import { formatClock, formatLongDate } from '../lib/dates'
import { formatLKR } from '../lib/format'
import { formatPhone, isValidPhone } from '../lib/phone'
import type { DeliverySlotKey, PaymentMethod } from '../types/admin'
import type { Address } from '../types'
import { sizedImage } from '../lib/images'

const PAYMENT_OPTIONS: { id: PaymentMethod; title: string; description: string; icon: typeof CreditCard }[] = [
  { id: 'CARD', title: 'Pay online by card', description: 'Visa, Mastercard, Amex and local bank cards via PayHere. Best for overseas senders.', icon: CreditCard },
  { id: 'CASH_ON_DELIVERY', title: 'Cash on delivery', description: 'Pay the rider in cash when the order is delivered.', icon: Banknote },
  { id: 'WHATSAPP', title: 'Confirm on WhatsApp', description: 'We save your order, then you send it to us on WhatsApp to arrange payment (e.g. bank transfer).', icon: MessageCircle },
]

interface FormState {
  customerName: string
  customerPhone: string
  customerEmail: string
  recipientName: string
  recipientPhone: string
  address: string
  area: string
  district: string
  deliveryDate: string
  deliverySlot: DeliverySlotKey | ''
  cardMessage: string
  deliveryNotes: string
  paymentMethod: PaymentMethod
  saveAddress: boolean
}

type Errors = Partial<Record<keyof FormState, string>>

// Wait until we know who is signed in, so the form can start pre-filled.
export default function Checkout() {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-[60vh]" aria-busy="true" />
  return <CheckoutForm key={user?.id ?? 'guest'} />
}

function CheckoutForm() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { items, clear, cardMessage } = useCart()
  const { user } = useAuth()
  const shop = useShop()

  const [form, setForm] = useState<FormState>(() => {
    const zone = shop.deliveryZones.find((z) => z.district === 'Colombo')
    return {
      customerName: user?.name ?? '',
      customerPhone: user ? formatPhone(user.phone) : '',
      customerEmail: user?.email ?? '',
      recipientName: '',
      recipientPhone: '',
      address: '',
      area: '',
      district: 'Colombo',
      deliveryDate: earliestDeliveryDate(zone, shop.sameDayCutoff),
      deliverySlot: '',
      cardMessage,
      deliveryNotes: '',
      paymentMethod: 'CARD',
      saveAddress: false,
    }
  })
  const [errors, setErrors] = useState<Errors>({})
  const [promoInput, setPromoInput] = useState('')
  const [appliedPromo, setAppliedPromo] = useState('')
  const [promoMessage, setPromoMessage] = useState<string | null>(null)

  const { data: addresses = [] } = useQuery({
    queryKey: ['me', 'addresses', user?.id],
    queryFn: () => listAddresses(user!.id),
    enabled: Boolean(user),
  })

  const zone = shop.deliveryZones.find((z) => z.active && z.district === form.district)
  const earliest = earliestDeliveryDate(zone, shop.sameDayCutoff)
  const slots = zone ? availableSlots(form.deliveryDate, zone) : []
  const quote = useMemo(
    () => quoteOrder(items, form.district, form.deliverySlot, appliedPromo),
    [items, form.district, form.deliverySlot, appliedPromo]
  )

  const placeOrder = useMutation({
    mutationFn: createOrder,
    onSuccess: async (order) => {
      if (user && form.saveAddress) {
        await saveAddress(user.id, {
          label: form.area || 'Address',
          recipientName: form.recipientName,
          phone: form.recipientPhone,
          line1: form.address,
          city: form.area,
          district: form.district,
          isDefault: addresses.length === 0,
        }).catch(() => undefined)
      }
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product'] })
      queryClient.invalidateQueries({ queryKey: ['me'] })
      queryClient.invalidateQueries({ queryKey: ['admin'] })
      clear()
      navigate(order.paymentMethod === 'CARD' ? `/payment/${order.orderNumber}` : `/order-confirmation/${order.orderNumber}`, { replace: true })
    },
  })

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function applySavedAddress(a: Address) {
    setForm((prev) => ({ ...prev, recipientName: a.recipientName, recipientPhone: formatPhone(a.phone), address: a.line1, area: a.city, district: a.district }))
    setErrors({})
  }

  function sendToMe() {
    setForm((prev) => ({ ...prev, recipientName: prev.customerName, recipientPhone: prev.customerPhone }))
  }

  function applyPromoCode() {
    const code = promoInput.trim()
    if (!code) return
    const result = quoteOrder(items, form.district, form.deliverySlot, code)
    if (result.promoError) {
      setAppliedPromo('')
      setPromoMessage(result.promoError)
    } else {
      setAppliedPromo(code)
      setPromoMessage(null)
    }
  }

  function validate(): Errors {
    const e: Errors = {}
    if (!form.customerName.trim()) e.customerName = 'Please enter your name.'
    if (!isValidPhone(form.customerPhone)) e.customerPhone = 'Please enter a valid phone number, e.g. 077 123 4567.'
    if (form.customerEmail && !/^\S+@\S+\.\S+$/.test(form.customerEmail)) e.customerEmail = 'Please check the email address.'
    if (!form.recipientName.trim()) e.recipientName = "Please enter the recipient's name."
    if (!isValidPhone(form.recipientPhone)) e.recipientPhone = 'We need a phone number to call on arrival.'
    if (!form.address.trim()) e.address = 'Please enter the street address.'
    if (!form.area.trim()) e.area = 'Please enter the city or area.'
    if (!zone) e.district = `We don't deliver to ${form.district} online yet.`
    if (!form.deliveryDate || form.deliveryDate < earliest) e.deliveryDate = `The earliest delivery date is ${formatLongDate(earliest)}.`
    if (!form.deliverySlot || !slots.some((s) => s.key === form.deliverySlot)) e.deliverySlot = 'Please choose a delivery time.'
    return e
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) {
      document.getElementById(Object.keys(found)[0])?.focus()
      return
    }
    placeOrder.mutate({
      customerId: user?.role === 'CUSTOMER' ? user.id : undefined,
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      customerEmail: form.customerEmail,
      recipientName: form.recipientName,
      recipientPhone: form.recipientPhone,
      address: form.address,
      area: form.area,
      district: form.district,
      deliveryDate: form.deliveryDate,
      deliverySlot: form.deliverySlot as DeliverySlotKey,
      cardMessage: form.cardMessage,
      deliveryNotes: form.deliveryNotes,
      promoCode: appliedPromo || undefined,
      paymentMethod: form.paymentMethod,
      items,
    })
  }

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <EmptyState
          icon={ShoppingBag}
          title="There's nothing to check out yet"
          message="Add a bouquet, hamper or plant to your cart first."
          action={<Link to="/shop" className="px-5 py-2.5 rounded-lg bg-primary text-on-primary text-label-md">Shop flowers</Link>}
        />
      </div>
    )
  }

  const submitLabel =
    form.paymentMethod === 'CARD' ? `Pay ${formatLKR(quote.total)} securely` : form.paymentMethod === 'WHATSAPP' ? 'Place order & continue to WhatsApp' : 'Place order (pay on delivery)'

  return (
    <div className="flex flex-col w-full">
      <PageHeader title="Checkout" breadcrumbs={[{ label: 'Cart', to: '/cart' }, { label: 'Checkout' }]} />

      <form noValidate onSubmit={submit} className="max-w-7xl mx-auto w-full px-4 lg:px-12 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          {!shop.acceptingOrders && (
            <FormError message="We're not taking online orders right now. Please message us on WhatsApp and we'll help." />
          )}

          {/* 1. Sender */}
          <section className="bg-surface-container-lowest rounded-xl shadow-sm p-6 space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-headline-sm text-primary">1. Your details</h2>
              {!user && (
                <span className="text-body-sm text-secondary">
                  Have an account? <Link to="/sign-in?next=/checkout" className="text-primary font-semibold hover:underline">Sign in</Link> for saved addresses.
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField id="customerName" label="Your name" required autoComplete="name" value={form.customerName} onChange={(e) => update('customerName', e.target.value)} error={errors.customerName} />
              <TextField id="customerPhone" label="Your phone / WhatsApp" required type="tel" autoComplete="tel" placeholder="077 123 4567 or +44 ..." value={form.customerPhone} onChange={(e) => update('customerPhone', e.target.value)} error={errors.customerPhone} hint="We'll send order updates here." />
              <TextField id="customerEmail" label="Email (for your receipt)" type="email" autoComplete="email" className="sm:col-span-2" value={form.customerEmail} onChange={(e) => update('customerEmail', e.target.value)} error={errors.customerEmail} />
            </div>
          </section>

          {/* 2. Recipient */}
          <section className="bg-surface-container-lowest rounded-xl shadow-sm p-6 space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-headline-sm text-primary">2. Delivery address</h2>
              <button type="button" onClick={sendToMe} className="text-label-md text-primary hover:underline">Deliver to me</button>
            </div>
            {addresses.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-body-sm text-secondary w-full">Use a saved address:</span>
                {addresses.map((a) => (
                  <button key={a.id} type="button" onClick={() => applySavedAddress(a)} className="px-3 py-1.5 rounded-lg bg-surface-container text-label-md text-primary hover:bg-surface-container-high">
                    {a.label} — {a.city}
                  </button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField id="recipientName" label="Recipient's name" required value={form.recipientName} onChange={(e) => update('recipientName', e.target.value)} error={errors.recipientName} />
              <TextField id="recipientPhone" label="Recipient's phone" required type="tel" placeholder="077 123 4567" value={form.recipientPhone} onChange={(e) => update('recipientPhone', e.target.value)} error={errors.recipientPhone} hint="Our rider calls this number on arrival." />
              <TextField id="address" label="Street address" required autoComplete="street-address" placeholder="House no., street, apartment" className="sm:col-span-2" value={form.address} onChange={(e) => update('address', e.target.value)} error={errors.address} />
              <TextField id="area" label="City / area" required placeholder="e.g. Colombo 07, Nugegoda, Kandy" value={form.area} onChange={(e) => update('area', e.target.value)} error={errors.area} />
              <SelectField id="district" label="District" required value={form.district} onChange={(e) => update('district', e.target.value)} error={errors.district}>
                {DISTRICTS.map((d) => {
                  const z = shop.deliveryZones.find((x) => x.active && x.district === d)
                  return <option key={d} value={d}>{d}{z ? '' : ' — WhatsApp only'}</option>
                })}
              </SelectField>
            </div>
            {user && (
              <label className="flex items-center gap-2 text-body-sm text-on-surface cursor-pointer">
                <input type="checkbox" checked={form.saveAddress} onChange={(e) => update('saveAddress', e.target.checked)} className="accent-primary w-4 h-4" />
                Save this address to my account
              </label>
            )}
          </section>

          {/* 3. When */}
          <section className="bg-surface-container-lowest rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="font-display text-headline-sm text-primary">3. Delivery date & time</h2>
            {zone && (
              <p className="text-body-sm text-secondary">
                {zone.sameDay
                  ? `Same-day delivery to ${zone.district} for orders placed before ${formatClock(shop.sameDayCutoff)}.`
                  : `Deliveries to ${zone.district} are made from the next working day.`}
              </p>
            )}
            <TextField
              id="deliveryDate"
              label="Delivery date"
              required
              type="date"
              min={earliest}
              value={form.deliveryDate}
              onChange={(e) => update('deliveryDate', e.target.value)}
              error={errors.deliveryDate}
              className="max-w-xs"
            />
            <fieldset className="space-y-2">
              <legend id="deliverySlot" tabIndex={-1} className="text-label-md text-primary mb-1">
                Delivery time <span className="text-error">*</span>
              </legend>
              {slots.length === 0 ? (
                <p className="text-body-sm text-secondary">No times left on this date — please pick a later date.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {slots.map((s) => (
                    <label
                      key={s.key}
                      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${form.deliverySlot === s.key ? 'border-primary bg-primary-fixed/40' : 'border-surface-container-high hover:bg-surface-container-low'}`}
                    >
                      <input type="radio" name="slot" checked={form.deliverySlot === s.key} onChange={() => update('deliverySlot', s.key)} className="accent-primary mt-1" />
                      <span>
                        <span className="block text-title-md text-primary">{s.label}</span>
                        <span className="block text-body-sm text-secondary">{s.hours}{s.extraFee ? ` • +${formatLKR(s.extraFee)}` : ''}</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
              {errors.deliverySlot && <p className="text-body-sm text-error">{errors.deliverySlot}</p>}
            </fieldset>
          </section>

          {/* 4. Message */}
          <section className="bg-surface-container-lowest rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="font-display text-headline-sm text-primary">4. Card message & notes</h2>
            <TextAreaField id="cardMessage" label="Card message (free)" rows={3} maxLength={250} value={form.cardMessage} onChange={(e) => update('cardMessage', e.target.value)} hint={`${form.cardMessage.length}/250 — handwritten on a card. Leave empty for no card.`} />
            <TextAreaField id="deliveryNotes" label="Notes for the rider" rows={2} placeholder="e.g. Gate code, landmark, keep it a surprise — don't call before 10 AM" value={form.deliveryNotes} onChange={(e) => update('deliveryNotes', e.target.value)} />
          </section>

          {/* 5. Payment */}
          <section className="bg-surface-container-lowest rounded-xl shadow-sm p-6 space-y-3">
            <h2 className="font-display text-headline-sm text-primary">5. Payment</h2>
            <div className="space-y-2" role="radiogroup" aria-label="Payment method">
              {PAYMENT_OPTIONS.map(({ id, title, description, icon: Icon }) => (
                <label
                  key={id}
                  className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer border transition-colors ${form.paymentMethod === id ? 'border-primary bg-primary-fixed/40' : 'border-surface-container-high hover:bg-surface-container-low'}`}
                >
                  <input type="radio" name="payment" checked={form.paymentMethod === id} onChange={() => update('paymentMethod', id)} className="accent-primary mt-1" />
                  <Icon size={22} className={id === 'WHATSAPP' ? 'text-[#25D366] shrink-0' : 'text-primary shrink-0'} />
                  <span>
                    <span className="block text-title-md text-primary">{title}</span>
                    <span className="block text-body-sm text-secondary">{description}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>
        </div>

        {/* Summary */}
        <aside className="lg:col-span-5 lg:sticky lg:top-36 bg-surface-container-lowest rounded-xl shadow-md p-6 space-y-4">
          <h2 className="font-display text-headline-sm text-primary">Your order</h2>
          <ul className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {items.map((i) => (
              <li key={i.id} className="flex gap-3">
                <img src={sizedImage(i.imageUrl, 200)} alt="" className="w-14 h-16 rounded-lg object-cover bg-surface-container shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-title-md text-on-surface truncate">{i.name}</p>
                  <p className="text-body-sm text-secondary">Qty {i.quantity}</p>
                </div>
                <span className="text-body-md text-primary whitespace-nowrap">{formatLKR(i.unitPrice * i.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-2 border-t border-surface-container pt-4">
            <label htmlFor="promo" className="flex items-center gap-1.5 text-label-md text-primary"><Tag size={14} /> Promo code</label>
            <div className="flex gap-2">
              <input
                id="promo"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    applyPromoCode()
                  }
                }}
                placeholder="e.g. WELCOME10"
                className="flex-1 min-w-0 bg-surface-container-low rounded-lg px-3 py-2 text-body-md uppercase focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button type="button" onClick={applyPromoCode} className="px-4 rounded-lg bg-surface-container-high text-primary text-label-md hover:bg-primary hover:text-on-primary">Apply</button>
            </div>
            {promoMessage && <p className="text-body-sm text-error">{promoMessage}</p>}
            {appliedPromo && !quote.promoError && (
              <p className="text-body-sm text-emerald-700">
                {appliedPromo} applied.{' '}
                <button type="button" className="underline" onClick={() => { setAppliedPromo(''); setPromoInput('') }}>Remove</button>
              </p>
            )}
            {appliedPromo && quote.promoError && <p className="text-body-sm text-error">{quote.promoError}</p>}
          </div>

          <dl className="space-y-2 text-body-md border-t border-surface-container pt-4">
            <div className="flex justify-between"><dt className="text-secondary">Subtotal</dt><dd>{formatLKR(quote.subtotal)}</dd></div>
            {quote.discount > 0 && (
              <div className="flex justify-between text-emerald-700"><dt>Discount</dt><dd>− {formatLKR(quote.discount)}</dd></div>
            )}
            <div className="flex justify-between">
              <dt className="text-secondary">Delivery{form.deliverySlot === 'midnight' ? ' (midnight)' : ''}</dt>
              <dd>{quote.deliveryFee === null ? '—' : quote.deliveryFee === 0 ? 'Free' : formatLKR(quote.deliveryFee)}</dd>
            </div>
            <div className="flex justify-between text-headline-sm font-display text-primary pt-2 border-t border-surface-container">
              <dt>Total</dt><dd>{formatLKR(quote.total)}</dd>
            </div>
          </dl>

          <FormError message={placeOrder.error ? placeOrder.error.message : null} />

          <button
            type="submit"
            disabled={placeOrder.isPending || !shop.acceptingOrders}
            className="w-full btn-gradient  text-title-md py-3.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Lock size={17} /> {placeOrder.isPending ? 'Placing your order…' : submitLabel}
          </button>
          <p className="text-body-sm text-secondary text-center">
            By placing this order you agree to our <Link to="/refund-policy" className="underline">refund policy</Link>.
          </p>
        </aside>
      </form>
    </div>
  )
}
