import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Clock, Layers, MessageCircle, CalendarPlus } from 'lucide-react'
import { useWhatsApp } from '../../hooks/useShop'
import { createInquiry } from '../../services/shop'
import { FormError } from '../ui/Field'
import { isoDate } from '../../lib/dates'

const VENUES = [
  'Colombo Hotel Ballroom',
  'Colombo Lakeside / Garden Venue',
  'Galle Fort Heritage Venue',
  'Kandy Hill Country Venue',
  'Nuwara Eliya Hill Venue',
  'Private Beach Villa (Bentota / Mirissa)',
  'Other Estate / Ballroom',
]

const CEREMONY_TYPES = [
  'Traditional Sinhala Poruwa & Reception',
  'Modern Sculptural Poruwa',
  'Hindu Floral Mandap',
  'Church Ceremony & Ballroom Reception',
  'Intimate Boutique Gathering (Under 60 guests)',
]

const BUDGETS = ['Rs. 250K - 500K', 'Rs. 500K - 850K', 'Rs. 850K - 1.5M', 'Rs. 1.5M+ Bespoke']

const inputClass =
  'w-full bg-surface-container-low px-4 py-2 rounded-lg text-body-sm text-on-surface focus:bg-surface-container-lowest focus:outline-none shadow-inner'

export default function ConsultationSection() {
  const [form, setForm] = useState({
    names: '',
    email: '',
    phone: '',
    date: '',
    venue: '',
    ceremony: '',
    budget: BUDGETS[2],
    notes: '',
  })
  const whatsapp = useWhatsApp()
  const submit = useMutation({ mutationFn: createInquiry })

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    submit.mutate({
      type: 'WEDDING',
      name: form.names,
      email: form.email,
      phone: form.phone,
      eventDate: form.date,
      location: form.venue,
      budget: form.budget,
      details: form.notes.trim() || `${form.ceremony} at ${form.venue}`,
      extra: { 'Ceremony format': form.ceremony },
    })
  }

  const whatsappLink = whatsapp('Hello, I would like to enquire about wedding flowers.')

  return (
    <section id="consultation" className="w-full bg-surface-container-low py-14 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-4">
            <span className="text-[11px] uppercase tracking-widest text-surface-tint font-bold">Private Commissioning</span>
            <h2 className="font-display text-headline-lg lg:text-display-lg text-primary">Book Your Florist Consultation</h2>
            <p className="text-body-md text-secondary leading-relaxed">
              We take on a limited number of ceremonial installations each month so every one gets
              proper attention. Schedule a design discussion at our studio or over a video call.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm">
                <Clock size={28} className="text-primary mb-1" />
                <p className="text-title-md text-primary">6 to 12 Months</p>
                <p className="text-body-sm text-secondary">Recommended Poruwa lead-time</p>
              </div>
              <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm">
                <Layers size={28} className="text-tertiary mb-1" />
                <p className="text-title-md text-primary">Design Concepts</p>
                <p className="text-body-sm text-secondary">Layout ideas shared before you commit</p>
              </div>
            </div>
            <div className="bg-primary-container text-on-primary p-6 rounded-xl shadow-md space-y-2 mt-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-primary-fixed">
                <span className="w-2 h-2 rounded-full bg-[#25D366]" />
                Overseas &amp; Urgent Enquiries
              </div>
              <p className="text-body-sm text-on-primary-container">
                Planning your ceremony from the UK, Australia, the US, or the Middle East? Message our
                wedding team directly.
              </p>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-title-md px-4 py-2 rounded-lg transition-all shadow-sm w-full justify-center"
              >
                <MessageCircle size={20} />
                <span>WhatsApp Our Wedding Team</span>
              </a>
            </div>
          </div>

          <div className="lg:col-span-7 bg-surface-container-lowest p-6 md:p-10 rounded-xl shadow-md">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-label-md text-primary" htmlFor="client_names">Couple / Client Name(s) *</label>
                  <input id="client_names" required type="text" placeholder="e.g., Dilshan & Chamari" className={inputClass}
                    value={form.names} onChange={(e) => update('names', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-label-md text-primary" htmlFor="client_email">Email Address *</label>
                  <input id="client_email" required type="email" placeholder="name@example.com" className={inputClass}
                    value={form.email} onChange={(e) => update('email', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-label-md text-primary" htmlFor="client_phone">Contact Number / WhatsApp *</label>
                  <input id="client_phone" required type="tel" placeholder="+94 77 000 0000" className={inputClass}
                    value={form.phone} onChange={(e) => update('phone', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-label-md text-primary" htmlFor="event_date">Ceremony Date *</label>
                  <input id="event_date" required type="date" min={isoDate(1)} className={inputClass}
                    value={form.date} onChange={(e) => update('date', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-label-md text-primary" htmlFor="event_venue">Venue / Location *</label>
                  <select id="event_venue" required className={inputClass} value={form.venue} onChange={(e) => update('venue', e.target.value)}>
                    <option value="" disabled>Select venue or region</option>
                    {VENUES.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-label-md text-primary" htmlFor="ceremony_type">Ceremony Format *</label>
                  <select id="ceremony_type" required className={inputClass} value={form.ceremony} onChange={(e) => update('ceremony', e.target.value)}>
                    <option value="" disabled>Select ceremony format</option>
                    {CEREMONY_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-label-md text-primary block">Estimated Floral Budget (LKR)</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {BUDGETS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => update('budget', b)}
                      className={
                        form.budget === b
                          ? 'py-1 px-2 text-center rounded-lg bg-primary text-on-primary text-label-md transition-all shadow-sm'
                          : 'py-1 px-2 text-center rounded-lg bg-surface-container text-label-md text-on-surface-variant hover:bg-surface-container-high transition-all'
                      }
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-label-md text-primary" htmlFor="vision_notes">Style Notes &amp; Special Wishes</label>
                <textarea id="vision_notes" rows={3} className={inputClass}
                  placeholder="Tell us about your colour mood, family floral traditions, favourite blooms (e.g. lotus, jasmine, lilies)..."
                  value={form.notes} onChange={(e) => update('notes', e.target.value)} />
              </div>

              <FormError message={submit.error ? submit.error.message : null} />

              <button
                type="submit"
                disabled={submit.isPending}
                className="w-full bg-primary hover:bg-primary-container text-on-primary text-title-md py-4 rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
              >
                <CalendarPlus size={20} />
                <span>{submit.isPending ? 'Sending…' : 'Request a consultation'}</span>
              </button>

              {submit.data && (
                <div role="status" className="p-4 bg-primary-fixed text-on-primary-fixed rounded-lg text-center text-body-sm">
                  <strong>Thank you.</strong> Your request {submit.data.reference} has been received. Our wedding team will
                  review your date and venue and contact you within one working day.
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}