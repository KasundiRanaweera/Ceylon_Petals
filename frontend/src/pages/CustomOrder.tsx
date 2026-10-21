import { sizedImage } from '../lib/images'
import { SITE_IMAGES } from '../data/siteImages'
import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Heart, Package, Building2, Palette, CircleCheck, MessageCircle } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import { FormError, SelectField, TextAreaField, TextField } from '../components/ui/Field'
import { createInquiry } from '../services/shop'
import { useAuth } from '../hooks/useAuth'
import { useWhatsApp } from '../hooks/useShop'
import { isoDate } from '../lib/dates'
import type { InquiryType } from '../types'

const TYPES: { id: InquiryType; title: string; description: string; icon: typeof Heart }[] = [
  { id: 'CUSTOM', title: 'Custom design', description: 'A one-off bouquet or arrangement in your colours', icon: Palette },
  { id: 'BULK', title: 'Bulk order', description: 'Many of the same — events, schools, prize-givings', icon: Package },
  { id: 'CORPORATE', title: 'Corporate gifting', description: 'Client hampers, office flowers, branded ribbons', icon: Building2 },
  { id: 'WEDDING', title: 'Wedding & Poruwa', description: 'Bridal bouquets, Poruwa and venue décor', icon: Heart },
]

const BUDGETS = ['Under Rs. 25,000', 'Rs. 25,000 – 75,000', 'Rs. 75,000 – 250,000', 'Rs. 250,000 – 1M', 'Over Rs. 1M', 'Not sure yet']

export default function CustomOrder() {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-[60vh]" aria-busy="true" />
  return <CustomOrderForm key={user?.id ?? 'guest'} />
}

function CustomOrderForm() {
  const [params] = useSearchParams()
  const { user } = useAuth()
  const whatsapp = useWhatsApp()
  const initialType = TYPES.find((t) => t.id === params.get('type')?.toUpperCase())?.id ?? 'CUSTOM'
  const [form, setForm] = useState({
    type: initialType,
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: '',
    eventDate: '',
    location: '',
    quantity: '',
    budget: '',
    details: '',
  })
  const submit = useMutation({ mutationFn: createInquiry })
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    submit.mutate({
      type: form.type,
      name: form.name,
      email: form.email,
      phone: form.phone,
      eventDate: form.eventDate || undefined,
      location: form.location || undefined,
      quantity: form.quantity || undefined,
      budget: form.budget || undefined,
      details: form.details,
    })
  }

  if (submit.data) {
    return (
      <section className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-surface-container-lowest ring-1 ring-[#d4af37]/60 text-tertiary flex items-center justify-center">
          <CircleCheck size={30} />
        </div>
        <h1 className="font-display text-headline-lg text-on-surface">Thank you — we've got your request</h1>
        <p className="text-body-lg leading-relaxed text-on-surface-variant">
          Your reference is <strong className="text-tertiary">{submit.data.reference}</strong>. Our florist will contact you within one working day
          with ideas and a quote.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <a
            href={whatsapp(`Hello! I just sent custom request ${submit.data.reference}. I'd like to share some photos.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 px-5 py-2.5 rounded-lg bg-[#25D366] text-white text-label-md transition-colors hover:bg-[#1ebe5a]"
          >
            <MessageCircle size={16} /> Send reference photos on WhatsApp
          </a>
          <Link to="/shop" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#d4af37] px-5 py-2.5 text-label-md text-tertiary transition-colors hover:bg-[#d4af37] hover:text-on-tertiary-container">Back to the shop</Link>
        </div>
      </section>
    )
  }

  const isEvent = form.type === 'WEDDING' || form.type === 'BULK' || form.type === 'CORPORATE'

  return (
    <div className="flex flex-col w-full">
      <PageHeader
        eyebrow="Made just for you"
        title="Request a custom order"
        subtitle="Tell us what you have in mind — a special colour palette, 100 roses for an event, or hampers for your clients. We'll reply with ideas and a quote."
        breadcrumbs={[{ label: 'Custom order' }]}
        backdrop={{ src: sizedImage(SITE_IMAGES.highlandRoses, 1408), alt: 'Pink garden roses in the misty Sri Lankan hills' }}
      />

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto w-full px-4 lg:px-12 py-12 lg:py-16 space-y-10">
        <fieldset className="space-y-4">
          <legend className="font-display text-headline-sm text-on-surface mb-3">What do you need?</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TYPES.map(({ id, title, description, icon: Icon }) => (
              <label
                key={id}
                className={`flex items-start gap-4 p-5 rounded-xl cursor-pointer border bg-surface-container-lowest shadow-[0_18px_40px_-28px_rgba(48,48,48,0.35)] transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#d4af37] ${
                  form.type === id ? 'border-[#d4af37] ring-1 ring-[#d4af37]' : 'border-outline-variant/60 hover:bg-surface-container-low'
                }`}
              >
                <input type="radio" name="type" checked={form.type === id} onChange={() => setForm((f) => ({ ...f, type: id }))} className="sr-only" />
                <Icon size={22} className="text-tertiary shrink-0 mt-0.5" />
                <span>
                  <span className="block font-display text-[18px] leading-snug font-medium text-on-surface">{title}</span>
                  <span className="mt-1 block text-body-sm leading-relaxed text-on-surface-variant">{description}</span>
                </span>
              </label>
            ))}
          </div>
          {form.type === 'WEDDING' && (
            <p className="text-body-sm leading-relaxed text-on-surface-variant">
              Planning a full wedding? See our <Link to="/wedding-events" className="text-tertiary underline underline-offset-4 hover:text-on-surface">Weddings & Events</Link> page for packages and past work.
            </p>
          )}
        </fieldset>

        <section className="rounded-xl bg-surface-container-lowest ring-1 ring-outline-variant/40 shadow-[0_18px_40px_-28px_rgba(48,48,48,0.35)] p-6 sm:p-8 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField id="name" label="Your name" required value={form.name} onChange={set('name')} />
            <TextField id="phone" label="Phone / WhatsApp" type="tel" required placeholder="077 123 4567" value={form.phone} onChange={set('phone')} />
            <TextField id="email" label="Email" type="email" required value={form.email} onChange={set('email')} />
            <TextField id="eventDate" label={isEvent ? 'Event date' : 'Needed by'} type="date" min={isoDate(1)} value={form.eventDate} onChange={set('eventDate')} />
            <TextField id="location" label={isEvent ? 'Venue / city' : 'Delivery city'} placeholder="e.g. Colombo 03, Kandy" value={form.location} onChange={set('location')} />
            {form.type !== 'CUSTOM' && (
              <TextField id="quantity" label="Quantity" placeholder="e.g. 40 hampers, 120 roses" value={form.quantity} onChange={set('quantity')} />
            )}
            <SelectField id="budget" label="Budget" value={form.budget} onChange={set('budget')}>
              <option value="">Select a range</option>
              {BUDGETS.map((b) => <option key={b}>{b}</option>)}
            </SelectField>
          </div>
          <TextAreaField
            id="details"
            label="Tell us about it"
            required
            rows={5}
            placeholder="Colours, favourite flowers (lotus, jasmine, roses…), style, who it's for, any branding…"
            value={form.details}
            onChange={set('details')}
          />
          <FormError message={submit.error ? submit.error.message : null} />
          <button type="submit" disabled={submit.isPending} className="inline-flex min-h-12 w-full sm:w-auto items-center justify-center px-8 py-3 rounded-lg btn-gradient text-title-md disabled:opacity-60">
            {submit.isPending ? 'Sending…' : 'Send request'}
          </button>
        </section>
      </form>
    </div>
  )
}
