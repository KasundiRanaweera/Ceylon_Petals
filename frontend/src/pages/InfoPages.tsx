import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import { useShop, useWhatsApp } from '../hooks/useShop'
import { DELIVERY_SLOTS } from '../lib/deliverySlots'
import { formatClock } from '../lib/dates'
import { formatLKR } from '../lib/format'
import { formatPhone } from '../lib/phone'

// Help pages linked from the footer. Copy here is a sensible starting point — the owner
// should review it (especially the policies) before launch.

function InfoLayout({ title, subtitle, crumb, children }: { title: string; subtitle?: string; crumb: string; children: ReactNode }) {
  return (
    <div className="flex flex-col w-full">
      <PageHeader title={title} subtitle={subtitle} breadcrumbs={[{ label: crumb }]} />
      <section className="max-w-4xl mx-auto w-full px-4 lg:px-12 py-12 lg:py-16 space-y-6">{children}</section>
    </div>
  )
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl bg-surface-container-lowest ring-1 ring-outline-variant/40 shadow-[0_18px_40px_-28px_rgba(48,48,48,0.35)] p-6 sm:p-8 space-y-4">
      <h2 className="flex items-center gap-3 font-display text-headline-sm text-on-surface"><span aria-hidden="true" className="h-px w-6 shrink-0 bg-[#d4af37]" />{title}</h2>
      <div className="text-body-md text-on-surface-variant leading-relaxed space-y-2">{children}</div>
    </div>
  )
}

export function DeliveryInfo() {
  const shop = useShop()
  const whatsapp = useWhatsApp()
  const zones = shop.deliveryZones.filter((z) => z.active)

  return (
    <InfoLayout crumb="Delivery" title="Delivery areas & fees" subtitle="Hand-delivered by our own team in Colombo and suburbs, and by trusted partners further afield.">
      <div className="rounded-xl bg-surface-container-lowest ring-1 ring-outline-variant/40 shadow-[0_18px_40px_-28px_rgba(48,48,48,0.35)] overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low text-[12px] uppercase tracking-[0.18em] text-tertiary">
              <th className="px-5 py-4 font-medium">District</th>
              <th className="px-5 py-4 font-medium">Delivery fee</th>
              <th className="px-5 py-4 font-medium">Same-day</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/40 text-body-md text-on-surface-variant">
            {zones.map((z) => (
              <tr key={z.id}>
                <td className="px-5 py-4 text-title-md text-on-surface">{z.district}</td>
                <td className="px-5 py-4">{formatLKR(z.fee)}</td>
                <td className="px-5 py-4">
                  {z.sameDay ? <span className="inline-flex items-center gap-1 text-emerald-700"><Check size={16} /> Yes</span> : <span className="inline-flex items-center gap-1 text-secondary"><X size={16} /> Next day</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {shop.freeDeliveryOver > 0 && (
        <p className="rounded-xl bg-surface-container-low ring-1 ring-[#d4af37]/50 px-5 py-4 text-body-md text-tertiary font-semibold">Free delivery on orders over {formatLKR(shop.freeDeliveryOver)}.</p>
      )}
      <Card title="Delivery times">
        <ul className="space-y-1">
          {DELIVERY_SLOTS.map((s) => (
            <li key={s.key}>
              <strong className="text-on-surface">{s.label}</strong> — {s.hours}
              {s.extraFee > 0 && ` (+${formatLKR(s.extraFee)}, same-day areas only)`}
            </li>
          ))}
        </ul>
        <p>Order before {formatClock(shop.sameDayCutoff)} for same-day delivery in same-day areas. Poya days and public holidays may have limited slots.</p>
      </Card>
      <Card title="Another district?">
        <p>
          We can often arrange delivery elsewhere in Sri Lanka by courier.{' '}
          <a href={whatsapp('Hello! Can you deliver to my area?')} target="_blank" rel="noopener noreferrer" className="text-tertiary underline underline-offset-4 hover:text-on-surface">
            Message us on WhatsApp
          </a>{' '}
          with the town and date.
        </p>
      </Card>
    </InfoLayout>
  )
}

export function CareGuide() {
  return (
    <InfoLayout crumb="Care guide" title="Flower & plant care" subtitle="Simple steps to keep your flowers fresh in Sri Lanka's warm, humid climate.">
      <Card title="Fresh flowers">
        <ol className="list-decimal pl-5 space-y-1">
          <li>Trim 1–2 cm off each stem at an angle as soon as they arrive.</li>
          <li>Use a clean vase with cool water and the flower food sachet we include.</li>
          <li>Remove leaves that would sit below the water line.</li>
          <li>Keep away from direct sun, fruit bowls and A/C or fan drafts.</li>
          <li>Change the water and re-trim the stems every two days.</li>
        </ol>
      </Card>
      <Card title="Orchids">
        <p>Water once a week by soaking the roots briefly, then let them drain. Bright, indirect light is best. Dendrobiums can bloom for 8 weeks or more.</p>
      </Card>
      <Card title="Indoor plants">
        <p>Check the care card that comes with your plant. As a rule, water only when the top 2–3 cm of soil is dry, and keep plants out of strong afternoon sun. In air-conditioned rooms, mist the leaves a few times a week.</p>
      </Card>
    </InfoLayout>
  )
}

const FAQS: { q: string; a: ReactNode }[] = [
  { q: 'Can I get same-day delivery?', a: 'Yes, in our same-day districts (see Delivery areas) when you order before the daily cut-off time.' },
  { q: 'How do I pay?', a: 'By card online through PayHere (Visa, Mastercard, Amex and local cards), cash on delivery, or by confirming your order on WhatsApp and paying by bank transfer.' },
  { q: 'I live overseas — can I send flowers to family in Sri Lanka?', a: 'Of course. Pay by card, enter your overseas WhatsApp number, and we will send you a photo when the flowers are handed over.' },
  { q: 'Can I add a message?', a: 'Every order includes a free handwritten card. Add your message at checkout.' },
  { q: 'What if a flower is out of season?', a: 'We may swap a stem for one of equal or higher value in the same colours, so your arrangement still looks its best.' },
  { q: 'Can I change or cancel my order?', a: 'Message us on WhatsApp as soon as possible with your order number. Changes are free until we start preparing your order.' },
  { q: 'Do I need an account?', a: <>No — you can check out as a guest and use <Link to="/track-order" className="text-tertiary underline underline-offset-4 hover:text-on-surface">Track order</Link>. An account saves your addresses and order history.</> },
]

export function Faq() {
  return (
    <InfoLayout crumb="FAQ" title="Frequently asked questions">
      <div className="space-y-4">
        {FAQS.map((f) => (
          <details key={f.q} className="group rounded-xl bg-surface-container-lowest ring-1 ring-outline-variant/40 shadow-[0_18px_40px_-28px_rgba(48,48,48,0.35)] px-6 py-5 open:ring-[#d4af37]/60">
            <summary className="cursor-pointer list-none flex min-h-11 items-center justify-between gap-4 rounded-lg font-display text-[18px] leading-snug font-medium text-on-surface focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d4af37]">
              {f.q}
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#d4af37] text-tertiary transition-transform group-open:rotate-45 text-xl leading-none">+</span>
            </summary>
            <div className="mt-4 border-t border-outline-variant/40 pt-4 text-body-md leading-relaxed text-on-surface-variant">{f.a}</div>
          </details>
        ))}
      </div>
    </InfoLayout>
  )
}

export function RefundPolicy() {
  const shop = useShop()
  return (
    <InfoLayout crumb="Refund policy" title="Refunds & replacements">
      <Card title="Freshness guarantee">
        <p>If your flowers arrive damaged or not fresh, send us a photo on WhatsApp ({formatPhone(shop.whatsappNumber)}) within 24 hours of delivery and we will replace them free of charge.</p>
      </Card>
      <Card title="Cancellations">
        <p>You can cancel for a full refund until we start preparing your order. After that, we may not be able to refund because flowers are made to order.</p>
      </Card>
      <Card title="Failed deliveries">
        <p>If the recipient can't be reached at the address and phone number given, we will try once more on the same day. A second delivery attempt on another day may have a delivery fee.</p>
      </Card>
      <Card title="Refund timing">
        <p>Card refunds are sent back through PayHere and usually appear within 5–7 working days. Cash and bank-transfer refunds are paid by bank transfer.</p>
      </Card>
    </InfoLayout>
  )
}

export function Privacy() {
  const shop = useShop()
  return (
    <InfoLayout crumb="Privacy & terms" title="Privacy & terms">
      <Card title="What we collect">
        <p>Your name, contact details, and the recipient's name, phone and address — only to deliver your order and keep you updated.</p>
      </Card>
      <Card title="Payments">
        <p>Card payments are processed by PayHere. We never see or store your full card number.</p>
      </Card>
      <Card title="Contact">
        <p>Questions about your data? Email <a className="text-tertiary underline underline-offset-4 hover:text-on-surface" href={`mailto:${shop.email}`}>{shop.email}</a>.</p>
      </Card>
    </InfoLayout>
  )
}
