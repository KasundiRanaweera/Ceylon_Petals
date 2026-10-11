import type { AdminOrder, DeliverySlotKey, OrderItem, OrderStatus, PaymentMethod, PaymentStatus } from '../types/admin'
import type { Inquiry, Product } from '../types'
import type { MockDb, StoredUser } from '../services/mockDb'
import { SEED_CATEGORIES, SEED_PRODUCTS } from './catalog'
import { DEFAULT_SETTINGS } from './settings'
import { isoDate } from '../lib/dates'
import { effectivePrice } from '../lib/pricing'

// Builds the demo database the first time the site is opened (or after "Reset demo data").
// Dates are relative to "now", so the Today / Tomorrow views always have something in them.

export const DEMO_OWNER = { email: 'owner@ceylonpetals.lk', password: 'Owner@123' }
export const DEMO_CUSTOMER = { email: 'customer@example.com', password: 'Customer@123' }

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600_000).toISOString()
}

function daysAgo(d: number, hour = 10): string {
  const date = new Date()
  date.setDate(date.getDate() - d)
  date.setHours(hour, 15, 0, 0)
  return date.toISOString()
}

const bySlug = (slug: string): Product => {
  const p = SEED_PRODUCTS.find((x) => x.slug === slug)
  if (!p) throw new Error(`Unknown seed product ${slug}`)
  return p
}

function line(slug: string, quantity = 1): OrderItem {
  const p = bySlug(slug)
  return { productId: p.id, slug: p.slug, name: p.name, imageUrl: p.images[0], unitPrice: effectivePrice(p), quantity }
}

export function summarise(items: OrderItem[]): string {
  return items.map((i) => (i.quantity > 1 ? `${i.name} × ${i.quantity}` : i.name)).join(', ')
}

interface OrderSpec {
  n: number
  createdAt: string
  customer: [name: string, phone: string, email?: string]
  customerId?: string
  overseas?: boolean
  recipient: [name: string, area: string, district: string]
  deliveryDate: string
  slot: DeliverySlotKey
  items: OrderItem[]
  card?: string
  method: PaymentMethod
  payment: PaymentStatus
  status: OrderStatus
  fee?: number
}

const STEPS: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED']

function history(status: OrderStatus, createdAt: string) {
  const start = new Date(createdAt).getTime()
  if (status === 'CANCELLED' || status === 'PAYMENT_FAILED') {
    return [{ status: 'PENDING' as const, at: createdAt }, { status, at: new Date(start + 3600_000).toISOString() }]
  }
  return STEPS.slice(0, STEPS.indexOf(status) + 1).map((s, i) => ({ status: s, at: new Date(start + i * 3600_000).toISOString() }))
}

function order(spec: OrderSpec): AdminOrder {
  const subtotal = spec.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
  const deliveryFee = spec.fee ?? (subtotal >= DEFAULT_SETTINGS.freeDeliveryOver ? 0 : 500)
  const [recipientName, area, district] = spec.recipient
  return {
    id: String(spec.n),
    orderNumber: `CP-${spec.n}`,
    createdAt: spec.createdAt,
    customerId: spec.customerId,
    customerName: spec.customer[0],
    customerPhone: spec.customer[1],
    customerEmail: spec.customer[2],
    isOverseas: spec.overseas,
    recipientName,
    recipientPhone: spec.customer[1],
    address: `No. ${(spec.n % 90) + 10}, Main Street`,
    area,
    district,
    deliveryDate: spec.deliveryDate,
    deliverySlot: spec.slot,
    items: spec.items,
    itemsSummary: summarise(spec.items),
    cardMessage: spec.card,
    subtotal,
    deliveryFee,
    discount: 0,
    total: subtotal + deliveryFee,
    paymentMethod: spec.method,
    paymentStatus: spec.payment,
    status: spec.status,
    statusHistory: history(spec.status, spec.createdAt),
  }
}

// Small deterministic random generator, so the demo history looks the same for everyone.
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const GUESTS: [string, string, string][] = [
  ['Ishara Bandara', '94770000021', 'ishara.b@example.com'],
  ['Malith Senanayake', '94770000022', 'malith.s@example.com'],
  ['Hasini de Silva', '94770000023', 'hasini.ds@example.com'],
  ['Pradeep Kumara', '94770000024', 'pradeep.k@example.com'],
  ['Fathima Rizwan', '94770000025', 'fathima.r@example.com'],
  ['Janaki Herath', '94770000026', 'janaki.h@example.com'],
]

const AREAS: [string, string][] = [
  ['Colombo 03', 'Colombo'], ['Colombo 07', 'Colombo'], ['Nugegoda', 'Colombo'], ['Rajagiriya', 'Colombo'],
  ['Dehiwala', 'Colombo'], ['Negombo', 'Gampaha'], ['Kandy', 'Kandy'], ['Panadura', 'Kalutara'],
]

function demoHistory(): AdminOrder[] {
  const rand = rng(42)
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)]
  const slugs = SEED_PRODUCTS.map((p) => p.slug)
  const slots: DeliverySlotKey[] = ['morning', 'afternoon', 'evening']
  const methods: PaymentMethod[] = ['CARD', 'CARD', 'CARD', 'CASH_ON_DELIVERY', 'WHATSAPP']
  const result: AdminOrder[] = []
  let n = 900 // at most 29 days × 4 orders, so this never reaches the active orders (1035+)
  for (let day = 30; day >= 2; day--) {
    const count = 1 + Math.floor(rand() * 4)
    for (let i = 0; i < count; i++) {
      const customer = pick(GUESTS)
      const [area, district] = pick(AREAS)
      const cancelled = rand() < 0.06
      const items = [line(pick(slugs), rand() < 0.15 ? 2 : 1)]
      if (rand() < 0.2) items.push(line(pick(slugs)))
      result.push(
        order({
          n: n++,
          createdAt: daysAgo(day + 1, 9 + Math.floor(rand() * 10)),
          customer,
          recipient: [customer[0], area, district],
          deliveryDate: isoDate(-day),
          slot: pick(slots),
          items,
          method: pick(methods),
          payment: cancelled ? 'REFUNDED' : 'PAID',
          status: cancelled ? 'CANCELLED' : 'DELIVERED',
        })
      )
    }
  }
  return result
}

// The orders the owner is working on right now (same scenarios as the original admin sample data).
function activeOrders(demoCustomerId: string): AdminOrder[] {
  return [
    order({ n: 1049, createdAt: hoursAgo(1), customer: ['Hiruni Gunasekara', '94770000011'], recipient: ['Sachini Gunasekara', 'Dehiwala', 'Colombo'], deliveryDate: isoDate(5), slot: 'afternoon', items: [line('velvet-bloom-and-chocolate-box')], method: 'WHATSAPP', payment: 'PENDING', status: 'PENDING' }),
    order({ n: 1048, createdAt: hoursAgo(1.2), customer: ['Mahesh Rathnayake', '94770000010'], recipient: ['Dilini Rathnayake', 'Colombo 05', 'Colombo'], deliveryDate: isoDate(3), slot: 'evening', items: [line('the-colombo-velvet-grandeur')], card: 'Happy 5th anniversary, my love', method: 'CARD', payment: 'PAID', status: 'CONFIRMED' }),
    order({ n: 1047, createdAt: hoursAgo(1.4), customer: ['Ayesha Marikar', '94770000009'], recipient: ['Ayesha Marikar', 'Colombo 07', 'Colombo'], deliveryDate: isoDate(1), slot: 'morning', items: [line('golden-orchid-cascade')], method: 'CARD', payment: 'PAID', status: 'CONFIRMED' }),
    order({ n: 1046, createdAt: hoursAgo(1.6), customer: ['Sanjeewa Mendis', '94770000013'], overseas: true, recipient: ['Ruwanthi Mendis', 'Mount Lavinia', 'Colombo'], deliveryDate: isoDate(0), slot: 'midnight', items: [line('atelier-sweet-romance-chest')], card: 'Happy 25th anniversary, love from Melbourne', method: 'CARD', payment: 'PAID', status: 'CONFIRMED', fee: 1500 }),
    order({ n: 1045, createdAt: hoursAgo(1.8), customer: ['Prasad Wickremasinghe', '94770000012'], recipient: ['Prasad Wickremasinghe', 'Colombo 03', 'Colombo'], deliveryDate: isoDate(0), slot: 'evening', items: [line('velvet-bloom-and-chocolate-box')], method: 'CARD', payment: 'PAID', status: 'CONFIRMED' }),
    order({ n: 1044, createdAt: hoursAgo(2), customer: ['Chathurika Samarasinghe', '94770000008'], recipient: ['Ramani Silva', 'Colombo 05', 'Colombo'], deliveryDate: isoDate(0), slot: 'evening', items: [line('serenity-mountain-casablanca')], card: 'With deepest sympathies', method: 'CASH_ON_DELIVERY', payment: 'PENDING', status: 'PENDING' }),
    order({ n: 1043, createdAt: hoursAgo(2.2), customer: ['Kavindu Rajapaksa', '94770000007'], recipient: ['Nilmini Jayawardena', 'Rajagiriya', 'Colombo'], deliveryDate: isoDate(0), slot: 'evening', items: [line('highland-blush-symphony')], method: 'CARD', payment: 'PAID', status: 'CONFIRMED' }),
    order({ n: 1042, createdAt: hoursAgo(2.5), customer: ['Kasundi Wickramasinghe', '94770000001', DEMO_CUSTOMER.email], customerId: demoCustomerId, recipient: ['Dr. Nihal', 'Colombo 10', 'Colombo'], deliveryDate: isoDate(0), slot: 'afternoon', items: [line('nuwara-eliya-crimson-empress')], card: 'Get well soon from the Surgery team', method: 'CARD', payment: 'PAID', status: 'PREPARING' }),
    order({ n: 1041, createdAt: hoursAgo(3), customer: ['Dilshan Silva', '94770000002'], overseas: true, recipient: ['Anula Silva', 'Nugegoda', 'Colombo'], deliveryDate: isoDate(0), slot: 'morning', items: [line('pastel-dawn-cottage-bunch')], card: 'Happy 70th Amma, love from London', method: 'CARD', payment: 'PAID', status: 'OUT_FOR_DELIVERY' }),
    order({ n: 1040, createdAt: hoursAgo(3.5), customer: ['Shehan Fernando', '94770000003'], recipient: ['Shehan Fernando', 'Colombo 03', 'Colombo'], deliveryDate: isoDate(0), slot: 'morning', items: [line('golden-orchid-cascade')], card: 'Happy Anniversary Sweetheart', method: 'WHATSAPP', payment: 'PAID', status: 'DELIVERED' }),
    order({ n: 1039, createdAt: hoursAgo(4), customer: ['Tharindu Wijesekara', '94770000004'], recipient: ['Tharindu Wijesekara', 'Colombo 07', 'Colombo'], deliveryDate: isoDate(0), slot: 'afternoon', items: [line('casablanca-pure-ivory-lilies')], method: 'CARD', payment: 'PAID', status: 'CONFIRMED' }),
    order({ n: 1038, createdAt: hoursAgo(20), customer: ['Nadeesha Perera', '94770000005', 'nadeesha.p@example.com'], recipient: ['Kamani Perera', 'Kandy', 'Kandy'], deliveryDate: isoDate(1), slot: 'afternoon', items: [line('sunburst-morning-jubilee')], method: 'CASH_ON_DELIVERY', payment: 'PENDING', status: 'PENDING', fee: 1800 }),
    order({ n: 1037, createdAt: hoursAgo(22), customer: ['Ruwan Jayasinghe', '94770000006'], recipient: ['Ruwan Jayasinghe', 'Galle', 'Galle'], deliveryDate: isoDate(1), slot: 'morning', items: [line('velvet-rose-and-eucalyptus-petite')], method: 'CARD', payment: 'FAILED', status: 'PAYMENT_FAILED', fee: 1800 }),
    order({ n: 1036, createdAt: daysAgo(3), customer: ['Kasundi Wickramasinghe', '94770000001', DEMO_CUSTOMER.email], customerId: demoCustomerId, recipient: ['Tharushi Alwis', 'Galle', 'Galle'], deliveryDate: isoDate(-2), slot: 'morning', items: [line('pastel-dawn-cottage-bunch')], method: 'CARD', payment: 'PAID', status: 'DELIVERED', fee: 1800 }),
    order({ n: 1035, createdAt: daysAgo(4), customer: ['Roshan Peiris', '94770000015'], recipient: ['Mala Peiris', 'Colombo 08', 'Colombo'], deliveryDate: isoDate(-3), slot: 'afternoon', items: [line('casablanca-pure-ivory-lilies')], method: 'CARD', payment: 'REFUNDED', status: 'CANCELLED' }),
  ]
}

function users(): StoredUser[] {
  return [
    { id: 'u-owner', name: 'Shop Owner', email: DEMO_OWNER.email, phone: '94771234567', role: 'OWNER', createdAt: daysAgo(120), password: DEMO_OWNER.password },
    { id: 'u-demo', name: 'Kasundi Wickramasinghe', email: DEMO_CUSTOMER.email, phone: '94770000001', role: 'CUSTOMER', createdAt: daysAgo(40), password: DEMO_CUSTOMER.password },
    { id: 'u-amaya', name: 'Amaya Fernando', email: 'amaya.f@example.com', phone: '94770000031', role: 'CUSTOMER', createdAt: daysAgo(2), password: 'Password@1' },
    { id: 'u-chamath', name: 'Chamath Silva', email: 'chamath.s@example.com', phone: '94770000032', role: 'CUSTOMER', createdAt: daysAgo(4), password: 'Password@1' },
    { id: 'u-sithara', name: 'Sithara Perera', email: 'sithara.p@example.com', phone: '94770000033', role: 'CUSTOMER', createdAt: daysAgo(8), password: 'Password@1' },
    { id: 'u-nadeesha', name: 'Nadeesha Perera', email: 'nadeesha.p@example.com', phone: '94770000005', role: 'CUSTOMER', createdAt: daysAgo(9), password: 'Password@1' },
  ]
}

function inquiries(): Inquiry[] {
  return [
    {
      id: 'inq-3', reference: 'INQ-103', type: 'WEDDING', name: 'Dilshan & Chamari', email: 'dilshan.c@example.com', phone: '94770000041',
      eventDate: isoDate(140), location: 'Kandy Hill Country Venue', budget: 'Rs. 850K - 1.5M',
      details: 'Traditional Poruwa in white and gold with jasmine, plus reception table centrepieces for 250 guests.',
      extra: { 'Ceremony format': 'Traditional Sinhala Poruwa & Reception' }, status: 'NEW', createdAt: hoursAgo(5),
    },
    {
      id: 'inq-2', reference: 'INQ-102', type: 'CORPORATE', name: 'Nimali (HR, Lanka Logistics)', email: 'nimali@example.com', phone: '94770000042',
      eventDate: isoDate(21), location: 'Colombo 02', quantity: '40 hampers',
      details: 'Year-end client hampers with tea and chocolates, branded ribbon with our logo. Need VAT invoice.',
      status: 'CONTACTED', ownerNotes: 'Sent sample photos on WhatsApp.', createdAt: daysAgo(2),
    },
    {
      id: 'inq-1', reference: 'INQ-101', type: 'BULK', name: 'Ravindu Jayasuriya', email: 'ravindu.j@example.com', phone: '94770000043',
      eventDate: isoDate(9), location: 'Negombo', quantity: '120 single roses',
      details: 'Single wrapped roses for a school prize-giving. Red and white, with a small tag.',
      budget: 'Rs. 60,000', status: 'QUOTED', ownerNotes: 'Quoted Rs. 58,000 incl. delivery.', createdAt: daysAgo(5),
    },
  ]
}

export function createSeedDb(version: number): MockDb {
  const orders = [...activeOrders('u-demo'), ...demoHistory().reverse()]
  return {
    version,
    products: structuredClone(SEED_PRODUCTS),
    categories: structuredClone(SEED_CATEGORIES),
    orders,
    users: users(),
    addresses: [
      { id: 'a-1', userId: 'u-demo', label: 'Home', recipientName: 'Kasundi Wickramasinghe', phone: '94770000001', line1: '18/2 Ward Place', city: 'Colombo 07', district: 'Colombo', isDefault: true },
      { id: 'a-2', userId: 'u-demo', label: "Amma's house", recipientName: 'Anula Wickramasinghe', phone: '94770000051', line1: '5 Temple Road', city: 'Kandy', district: 'Kandy', isDefault: false },
    ],
    inquiries: inquiries(),
    settings: structuredClone(DEFAULT_SETTINGS),
    counters: { order: 1050, inquiry: 104 },
  }
}
