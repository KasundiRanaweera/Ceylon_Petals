import { randomUUID } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

// ---------------------------------------------------------------- in-memory database
// Just enough of Prisma to run the real checkout code: settings, zones, promos, products with
// stock, orders, users, and transactions that roll back when something throws.

interface ProductRow {
  id: string
  slug: string
  name: string
  price: number
  discountPrice: number | null
  stock: number
  isActive: boolean
  sameDay: boolean
  images: { url: string }[]
}
interface UserRow {
  id: string
  name: string
  email: string
  phone: string
  role: 'CUSTOMER' | 'OWNER'
  tokenVersion: number
  createdAt: Date
}
type OrderRow = Record<string, any>

const settings = {
  id: 1, shopName: 'Ceylon Petals', tagline: '', whatsappNumber: '94771234567', phone: '+94 11 234 5678',
  email: 'hello@ceylonpetals.lk', address: 'Colombo', openingHours: '8-9', sameDayCutoff: '14:00',
  acceptingOrders: true, freeDeliveryOver: 25000,
}
const zones = [
  { id: 'z1', district: 'Colombo', fee: 500, sameDay: true, active: true },
  { id: 'z2', district: 'Kandy', fee: 1800, sameDay: false, active: true },
  { id: 'z3', district: 'Galle', fee: 1800, sameDay: false, active: false },
]
const promos = [
  { code: 'WELCOME10', type: 'PERCENT', value: 10, minOrder: 10000, active: true },
  { code: 'OLDCODE', type: 'FIXED', value: 500, minOrder: 0, active: false },
]

const ID = {
  roses: randomUUID(), lilies: randomUUID(), plant: randomUUID(), slow: randomUUID(), hidden: randomUUID(),
}
let products: ProductRow[] = []
let orders: OrderRow[] = []
let users: UserRow[] = []
let nextNumber = 1050
let settingsRow: typeof settings = { ...settings }
let failStockFor: string | null = null

const baseProducts = (): ProductRow[] => [
  { id: ID.roses, slug: 'roses', name: 'Crimson Roses', price: 18500, discountPrice: null, stock: 5, isActive: true, sameDay: true, images: [{ url: 'https://img/roses.jpg' }] },
  { id: ID.lilies, slug: 'lilies', name: 'Ivory Lilies', price: 19800, discountPrice: 17000, stock: 2, isActive: true, sameDay: true, images: [{ url: 'https://img/lilies.jpg' }] },
  { id: ID.plant, slug: 'plant', name: 'Calathea', price: 8900, discountPrice: null, stock: 0, isActive: true, sameDay: true, images: [] },
  { id: ID.slow, slug: 'slow', name: 'Giant Ficus', price: 24000, discountPrice: null, stock: 10, isActive: true, sameDay: false, images: [{ url: 'https://img/ficus.jpg' }] },
  { id: ID.hidden, slug: 'hidden', name: 'Hidden Bouquet', price: 5000, discountPrice: null, stock: 10, isActive: false, sameDay: true, images: [] },
]

const prismaMock = {
  shopSettings: { findUnique: async () => settingsRow },
  deliveryZone: {
    findFirst: async ({ where }: any) => zones.find((z) => z.district === where.district && z.active === where.active) ?? null,
    findMany: async ({ where }: any) => zones.filter((z) => z.active === where.active).sort((a, b) => a.district.localeCompare(b.district)),
  },
  promoCode: { findUnique: async ({ where }: any) => promos.find((p) => p.code === where.code) ?? null },
  product: {
    findMany: async ({ where }: any) => products.filter((p) => where.id.in.includes(p.id) && p.isActive === where.isActive),
    updateMany: async ({ where, data }: any) => {
      if (failStockFor === where.id) return { count: 0 }
      const p = products.find((x) => x.id === where.id && x.isActive === where.isActive && x.stock >= where.stock.gte)
      if (!p) return { count: 0 }
      p.stock -= data.stock.decrement
      return { count: 1 }
    },
  },
  order: {
    create: async ({ data }: any) => {
      const id = randomUUID()
      const row: OrderRow = {
        ...data, id, number: nextNumber++, createdAt: new Date(), updatedAt: new Date(),
        paymentStatus: 'PENDING', status: 'PENDING', paymentReference: null, paidAt: null,
        items: data.items.create.map((i: any) => ({ id: randomUUID(), orderId: id, ...i })),
        history: [{ id: randomUUID(), orderId: id, status: data.history.create.status, createdAt: new Date() }],
      }
      delete row.history.create
      orders.push(row)
      return row
    },
    findUnique: async ({ where }: any) => orders.find((o) => o.number === where.number) ?? null,
    findMany: async ({ where }: any) => orders.filter((o) => o.userId === where.userId).sort((a, b) => b.createdAt - a.createdAt),
  },
  user: {
    findUnique: async ({ where }: any) => users.find((u) => (where.id ? u.id === where.id : u.email === where.email)) ?? null,
  },
  // A real transaction undoes everything if the callback throws. So does this one.
  $transaction: async (fn: (tx: unknown) => Promise<unknown>) => {
    const stockBefore = products.map((p) => [p.id, p.stock] as const)
    const orderCount = orders.length
    try {
      return await fn(prismaMock)
    } catch (error) {
      for (const [id, stock] of stockBefore) products.find((p) => p.id === id)!.stock = stock
      orders.length = orderCount
      throw error
    }
  },
}
vi.mock('../lib/prisma.js', () => ({ prisma: prismaMock }))

const { createApp } = await import('../app.js')
const { env } = await import('../config/env.js')
const { signAuthToken } = await import('../lib/tokens.js')
const { colomboNow, addDays } = await import('../lib/colomboTime.js')

// ---------------------------------------------------------------- helpers

const ORIGIN = 'http://localhost:5173'
const app = createApp()
const post = (path: string) => request(app).post(path).set('Origin', ORIGIN)
const get = (path: string) => request(app).get(path).set('Origin', ORIGIN)

const stockOf = (id: string) => products.find((p) => p.id === id)!.stock
const today = () => colomboNow().date
/** A date that is always valid for every zone (so tests do not depend on the time of day). */
const inDays = (n: number) => addDays(today(), n)

const baseOrder = (over: Record<string, unknown> = {}) => ({
  customerName: 'Amaya Fernando',
  customerPhone: '077 123 4567',
  customerEmail: 'amaya@example.com',
  recipientName: 'Dilini Perera',
  recipientPhone: '071 555 6666',
  address: '12 Lake Road',
  area: 'Colombo 07',
  district: 'Colombo',
  deliveryDate: inDays(3),
  deliverySlot: 'morning',
  paymentMethod: 'CASH_ON_DELIVERY',
  items: [{ productId: ID.roses, quantity: 1 }],
  ...over,
})

function makeUser(role: 'CUSTOMER' | 'OWNER', email: string) {
  const row: UserRow = { id: randomUUID(), name: 'Test', email, phone: '94771234567', role, tokenVersion: 0, createdAt: new Date() }
  users.push(row)
  return { id: row.id, cookie: `cp_session=${signAuthToken(row)}` }
}

beforeEach(() => {
  products = baseProducts()
  orders = []
  users = []
  nextNumber = 1050
  settingsRow = { ...settings }
  failStockFor = null
})
afterEach(() => vi.useRealTimers())

// ---------------------------------------------------------------- settings

describe('GET /api/settings', () => {
  it('shows the public settings: active zones only and no promo codes', async () => {
    const res = await get('/api/settings')
    expect(res.status).toBe(200)
    expect(res.body.whatsappNumber).toBe('94771234567')
    expect(res.body.deliveryZones.map((z: any) => z.district)).toEqual(['Colombo', 'Kandy'])
    expect(res.body.promoCodes).toEqual([])
    // Revalidated on every load, so changes the owner saves show on the next page view.
    expect(res.headers['cache-control']).toBe('no-cache')
  })
})

// ---------------------------------------------------------------- quote

describe('POST /api/orders/quote', () => {
  const quote = (body: object) => post('/api/orders/quote').send(body)

  it('prices from the database: sale prices, delivery and totals', async () => {
    // Lilies are on sale (17,000, not 19,800) and the cart is under the free-delivery limit.
    const res = await quote({ items: [{ productId: ID.lilies, quantity: 1 }], district: 'Colombo', deliverySlot: 'morning' })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ subtotal: 17000, deliveryFee: 500, discount: 0, total: 17500 })
    // A bigger cart gets free delivery.
    const big = await quote({ items: [{ productId: ID.roses, quantity: 1 }, { productId: ID.lilies, quantity: 2 }], district: 'Colombo' })
    expect(big.body).toEqual({ subtotal: 18500 + 2 * 17000, deliveryFee: 0, discount: 0, total: 52500 })
  })

  it('ignores any price the browser sends', async () => {
    const res = await quote({ items: [{ productId: ID.roses, quantity: 1, price: 1, unitPrice: 1 }], district: 'Colombo' })
    expect(res.body.subtotal).toBe(18500)
  })

  it('adds the midnight surcharge and applies free delivery', async () => {
    const midnight = await quote({ items: [{ productId: ID.roses, quantity: 1 }], district: 'Colombo', deliverySlot: 'midnight' })
    expect(midnight.body.deliveryFee).toBe(500 + 1000)
    const free = await quote({ items: [{ productId: ID.slow, quantity: 1 }, { productId: ID.roses, quantity: 1 }], district: 'Colombo' })
    expect(free.body.deliveryFee).toBe(0)
  })

  it('applies a promo code, and explains a bad one', async () => {
    const ok = await quote({ items: [{ productId: ID.roses, quantity: 1 }], district: 'Colombo', promoCode: 'welcome10' })
    expect(ok.body.discount).toBe(1850)
    expect(ok.body.total).toBe(18500 - 1850 + 500)
    const bad = await quote({ items: [{ productId: ID.roses, quantity: 1 }], district: 'Colombo', promoCode: 'OLDCODE' })
    expect(bad.body.discount).toBe(0)
    expect(bad.body.promoError).toBe('This promo code is not valid.')
  })

  it('has no delivery fee until a delivered-to district is known', async () => {
    expect((await quote({ items: [{ productId: ID.roses, quantity: 1 }] })).body.deliveryFee).toBeNull()
    expect((await quote({ items: [{ productId: ID.roses, quantity: 1 }], district: 'Galle' })).body.deliveryFee).toBeNull()
    expect((await quote({ items: [{ productId: ID.roses, quantity: 1 }], district: '', deliverySlot: '' })).status).toBe(200)
  })

  it('prices a custom hamper itself', async () => {
    const res = await quote({ items: [{ hamper: { base: 'roses', treats: ['pralines'], keepsake: 'candle' }, quantity: 1 }], district: 'Colombo' })
    expect(res.body.subtotal).toBe(12000 + 7500 + 4500)
  })

  it('refuses hidden products and an empty cart', async () => {
    expect((await quote({ items: [{ productId: ID.hidden, quantity: 1 }] })).status).toBe(422)
    expect((await quote({ items: [] })).status).toBe(400)
  })
})

// ---------------------------------------------------------------- checkout

describe('POST /api/orders (checkout)', () => {
  const checkout = (body: object) => post('/api/orders').send(body)

  it('creates the order with server-side prices, takes stock and returns a view token', async () => {
    const res = await checkout(baseOrder({ items: [{ productId: ID.roses, quantity: 2 }, { productId: ID.lilies, quantity: 1 }], cardMessage: ' Happy birthday ' }))
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      id: '1050', orderNumber: 'CP-1050', status: 'PENDING', paymentStatus: 'PENDING', paymentMethod: 'CASH_ON_DELIVERY',
      customerPhone: '94771234567', recipientPhone: '94715556666', isOverseas: false, district: 'Colombo',
      deliverySlot: 'morning', cardMessage: 'Happy birthday',
      subtotal: 2 * 18500 + 17000, deliveryFee: 0, discount: 0, total: 2 * 18500 + 17000, // over Rs. 25,000: free delivery
    })
    expect(res.body.itemsSummary).toBe('Crimson Roses × 2, Ivory Lilies')
    expect(res.body.items[0]).toMatchObject({ productId: ID.roses, name: 'Crimson Roses', unitPrice: 18500, quantity: 2, imageUrl: 'https://img/roses.jpg' })
    expect(res.body.statusHistory).toHaveLength(1)
    expect(res.body.statusHistory[0].status).toBe('PENDING')
    expect(typeof res.body.accessToken).toBe('string')
    expect(stockOf(ID.roses)).toBe(3)
    expect(stockOf(ID.lilies)).toBe(1)
    expect(orders).toHaveLength(1)
  })

  it('ignores prices, totals and statuses sent by the browser', async () => {
    const res = await checkout(baseOrder({
      total: 1, subtotal: 1, deliveryFee: 0, status: 'DELIVERED', paymentStatus: 'PAID',
      items: [{ productId: ID.roses, quantity: 1, unitPrice: 1, price: 1 }],
    }))
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ subtotal: 18500, total: 19000, status: 'PENDING', paymentStatus: 'PENDING' })
  })

  it('flags overseas customers', async () => {
    const res = await checkout(baseOrder({ customerPhone: '+44 7700 900123' }))
    expect(res.body.isOverseas).toBe(true)
    expect(res.body.customerPhone).toBe('447700900123')
  })

  it('prices custom hampers on the server', async () => {
    const res = await checkout(baseOrder({ items: [{ hamper: { base: 'orchids', treats: ['pralines', 'macarons'], keepsake: 'teacaddy' }, quantity: 1 }] }))
    expect(res.status).toBe(201)
    expect(res.body.subtotal).toBe(14500 + 7500 + 6800 + 9500)
    expect(res.body.items[0]).toMatchObject({ name: 'Custom-built hamper', options: expect.stringContaining('White Orchids + Swiss Chocolate') })
    expect(res.body.items[0].productId).toBeUndefined()
  })

  it('saves a valid promo code and refuses a bad one', async () => {
    const ok = await checkout(baseOrder({ promoCode: 'welcome10' }))
    expect(ok.body).toMatchObject({ discount: 1850, promoCode: 'WELCOME10', total: 18500 - 1850 + 500 })
    const bad = await checkout(baseOrder({ promoCode: 'OLDCODE' }))
    expect(bad.status).toBe(422)
    expect(bad.body.error.message).toBe('This promo code is not valid.')
    expect(orders).toHaveLength(1)
  })

  describe('stock', () => {
    it('refuses to sell more than is left, and changes nothing', async () => {
      const res = await checkout(baseOrder({ items: [{ productId: ID.lilies, quantity: 3 }] }))
      expect(res.status).toBe(422)
      expect(res.body.error.message).toBe('Only 2 of Ivory Lilies left. Please lower the quantity.')
      expect(stockOf(ID.lilies)).toBe(2)
      expect(orders).toHaveLength(0)
    })

    it('says so when something has sold out', async () => {
      const res = await checkout(baseOrder({ items: [{ productId: ID.plant, quantity: 1 }] }))
      expect(res.body.error.message).toBe('Calathea has just sold out. Please remove it from your cart.')
    })

    it('adds up the same product appearing on two cart lines', async () => {
      const res = await checkout(baseOrder({ items: [{ productId: ID.lilies, quantity: 1 }, { productId: ID.lilies, quantity: 2 }] }))
      expect(res.status).toBe(422)
      expect(stockOf(ID.lilies)).toBe(2)
    })

    it('puts stock back if the order fails part-way (all or nothing)', async () => {
      // Roses are taken first; then the lilies "sell out" to another customer at that exact moment.
      failStockFor = ID.lilies
      const res = await checkout(baseOrder({ items: [{ productId: ID.roses, quantity: 2 }, { productId: ID.lilies, quantity: 1 }] }))
      expect(res.status).toBe(422)
      expect(res.body.error.message).toMatch(/just bought by another customer/)
      expect(stockOf(ID.roses)).toBe(5) // rolled back
      expect(orders).toHaveLength(0)
    })

    it('two orders for the last item: only one succeeds', async () => {
      products.find((p) => p.id === ID.roses)!.stock = 1
      const [a, b] = await Promise.all([checkout(baseOrder()), checkout(baseOrder({ customerName: 'Someone Else' }))])
      expect([a.status, b.status].sort()).toEqual([201, 422])
      expect(stockOf(ID.roses)).toBe(0)
    })

    it('does not sell hidden products', async () => {
      const res = await checkout(baseOrder({ items: [{ productId: ID.hidden, quantity: 1 }] }))
      expect(res.status).toBe(422)
    })
  })

  describe('delivery rules (Sri Lankan time)', () => {
    it('rejects dates in the past and too far ahead', async () => {
      expect((await checkout(baseOrder({ deliveryDate: addDays(today(), -1) }))).status).toBe(422)
      const far = await checkout(baseOrder({ deliveryDate: inDays(200) }))
      expect(far.status).toBe(422)
      expect(far.body.error.message).toMatch(/120 days/)
    })

    it('same-day delivery works before the cut-off, with a slot that is still open', async () => {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date('2026-10-20T03:00:00Z')) // 08:30 in Colombo
      const ok = await checkout(baseOrder({ deliveryDate: '2026-10-20', deliverySlot: 'afternoon' }))
      expect(ok.status).toBe(201)
      const closedSlot = await checkout(baseOrder({ deliveryDate: '2026-10-20', deliverySlot: 'morning' }))
      expect(closedSlot.status).toBe(422)
      expect(closedSlot.body.error.message).toMatch(/delivery time is no longer available/)
    })

    it('same-day delivery is closed after the cut-off', async () => {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date('2026-10-20T09:30:00Z')) // 15:00 in Colombo
      const res = await checkout(baseOrder({ deliveryDate: '2026-10-20', deliverySlot: 'evening' }))
      expect(res.status).toBe(422)
      expect(res.body.error.message).toMatch(/delivery date is no longer available/)
      expect((await checkout(baseOrder({ deliveryDate: '2026-10-21', deliverySlot: 'evening' }))).status).toBe(201)
    })

    it('uses Colombo time even when the server clock is in the previous day', async () => {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date('2026-10-20T20:00:00Z')) // still the 20th in UTC, but 01:30 on the 21st in Colombo
      expect((await checkout(baseOrder({ deliveryDate: '2026-10-20', deliverySlot: 'evening' }))).status).toBe(422) // yesterday for us
      expect((await checkout(baseOrder({ deliveryDate: '2026-10-21', deliverySlot: 'evening' }))).status).toBe(201)
    })

    it('zones without same-day delivery need two days notice and have no midnight slot', async () => {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date('2026-10-20T03:00:00Z'))
      const kandy = (over: object) => baseOrder({ district: 'Kandy', area: 'Kandy', ...over })
      expect((await checkout(kandy({ deliveryDate: '2026-10-21' }))).status).toBe(422)
      expect((await checkout(kandy({ deliveryDate: '2026-10-22' }))).status).toBe(201)
      const midnight = await checkout(kandy({ deliveryDate: '2026-10-25', deliverySlot: 'midnight' }))
      expect(midnight.status).toBe(422)
    })

    it('charges the zone fee plus the midnight surcharge', async () => {
      const res = await checkout(baseOrder({ deliverySlot: 'midnight' }))
      expect(res.body.deliveryFee).toBe(1500)
      expect(res.body.total).toBe(18500 + 1500)
    })

    it('items that cannot be same-day (and custom hampers) need a later date', async () => {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date('2026-10-20T03:00:00Z'))
      const slow = await checkout(baseOrder({ deliveryDate: '2026-10-20', deliverySlot: 'evening', items: [{ productId: ID.slow, quantity: 1 }] }))
      expect(slow.status).toBe(422)
      expect(slow.body.error.message).toBe('Giant Ficus cannot be delivered on the same day. Please choose a later date.')
      const hamper = await checkout(baseOrder({ deliveryDate: '2026-10-20', deliverySlot: 'evening', items: [{ hamper: { base: 'roses', treats: [] }, quantity: 1 }] }))
      expect(hamper.status).toBe(422)
      expect((await checkout(baseOrder({ deliveryDate: '2026-10-21', items: [{ productId: ID.slow, quantity: 1 }] }))).status).toBe(201)
    })

    it('refuses districts we do not deliver to and a paused shop', async () => {
      const galle = await checkout(baseOrder({ district: 'Galle' }))
      expect(galle.status).toBe(422)
      expect(galle.body.error.message).toMatch(/don't deliver to Galle/)
      settingsRow = { ...settings, acceptingOrders: false }
      const paused = await checkout(baseOrder())
      expect(paused.status).toBe(422)
      expect(paused.body.error.message).toMatch(/not taking online orders/)
      expect(orders).toHaveLength(0)
    })
  })

  describe('validation', () => {
    it('lists every problem with the form', async () => {
      const res = await checkout({ items: [], customerName: '', customerPhone: '12', recipientName: '', recipientPhone: 'x', address: '', area: '', district: 'Atlantis', deliveryDate: 'tomorrow', deliverySlot: 'noon', paymentMethod: 'BITCOIN' })
      expect(res.status).toBe(400)
      const fields = res.body.error.details.map((d: any) => d.field.split('.')[0])
      expect(fields).toEqual(expect.arrayContaining(['items', 'customerName', 'customerPhone', 'recipientName', 'district', 'deliveryDate', 'deliverySlot', 'paymentMethod']))
    })

    it('rejects silly quantities and malformed ids', async () => {
      for (const items of [[{ productId: ID.roses, quantity: 0 }], [{ productId: ID.roses, quantity: 21 }], [{ productId: 'not-a-uuid', quantity: 1 }], [{ productId: ID.roses, quantity: 1.5 }]]) {
        expect((await checkout(baseOrder({ items }))).status).toBe(400)
      }
    })

    it('treats an empty email and empty optional fields as not given', async () => {
      const res = await checkout(baseOrder({ customerEmail: '', cardMessage: '', deliveryNotes: '  ', promoCode: '' }))
      expect(res.status).toBe(201)
      expect(res.body.customerEmail).toBeUndefined()
      expect(res.body.cardMessage).toBeUndefined()
    })

    it('limits the card message length', async () => {
      expect((await checkout(baseOrder({ cardMessage: 'x'.repeat(251) }))).status).toBe(400)
    })
  })

  describe('who placed it', () => {
    it('links the order to a signed-in customer, not to a guest or the owner', async () => {
      const customer = makeUser('CUSTOMER', 'c@example.com')
      const owner = makeUser('OWNER', 'o@example.com')
      const mine = await post('/api/orders').set('Cookie', customer.cookie).send(baseOrder())
      expect(mine.body.customerId).toBe(customer.id)
      const guest = await checkout(baseOrder())
      expect(guest.body.customerId).toBeUndefined()
      const byOwner = await post('/api/orders').set('Cookie', owner.cookie).send(baseOrder())
      expect(byOwner.body.customerId).toBeUndefined()
    })
  })

  it('refuses a card order while card payment is switched off, but cash and WhatsApp still work', async () => {
    const original = env.payhere.mode
    env.payhere.mode = 'disabled'
    try {
      const card = await checkout(baseOrder({ paymentMethod: 'CARD' }))
      expect(card.status).toBe(422)
      expect(card.body.error.message).toMatch(/Card payment is not available/)
      expect(stockOf(ID.roses)).toBe(5)
      expect((await checkout(baseOrder({ paymentMethod: 'CASH_ON_DELIVERY' }))).status).toBe(201)
      expect((await checkout(baseOrder({ paymentMethod: 'WHATSAPP' }))).status).toBe(201)
    } finally {
      env.payhere.mode = original
    }
    expect((await checkout(baseOrder({ paymentMethod: 'CARD' }))).status).toBe(201)
  })

  it('blocks checkout posted from another website', async () => {
    const res = await request(app).post('/api/orders').set('Origin', 'https://evil.example').send(baseOrder())
    expect(res.status).toBe(403)
    expect(orders).toHaveLength(0)
  })
})

// ---------------------------------------------------------------- viewing, tracking, my orders

describe('reading an order', () => {
  async function place(over: Record<string, unknown> = {}, cookie?: string) {
    const req = post('/api/orders')
    const res = await (cookie ? req.set('Cookie', cookie) : req).send(baseOrder(over))
    return res.body as { orderNumber: string; accessToken: string }
  }

  it('the person who ordered can open it with the checkout token', async () => {
    const order = await place()
    const res = await get(`/api/orders/${order.orderNumber}`).set('X-Order-Token', order.accessToken)
    expect(res.status).toBe(200)
    expect(res.body.orderNumber).toBe(order.orderNumber)
    expect(res.headers['cache-control']).toBe('no-store')
    expect((await get(`/api/orders/${order.orderNumber}?token=${order.accessToken}`)).status).toBe(200)
  })

  it('a guess is not enough: no token, a wrong token or another order\'s token all get 404', async () => {
    const first = await place()
    const second = await place()
    expect((await get(`/api/orders/${first.orderNumber}`)).status).toBe(404)
    expect((await get(`/api/orders/${first.orderNumber}`).set('X-Order-Token', 'nonsense')).status).toBe(404)
    expect((await get(`/api/orders/${first.orderNumber}`).set('X-Order-Token', second.accessToken)).status).toBe(404)
    expect((await get('/api/orders/CP-99999').set('X-Order-Token', first.accessToken)).status).toBe(404)
    expect((await get('/api/orders/abc')).status).toBe(404)
  })

  it('the owner can open any order; another customer cannot; the buyer can', async () => {
    const buyer = makeUser('CUSTOMER', 'buyer@example.com')
    const stranger = makeUser('CUSTOMER', 'stranger@example.com')
    const owner = makeUser('OWNER', 'owner@example.com')
    const order = await place({}, buyer.cookie)

    expect((await get(`/api/orders/${order.orderNumber}`).set('Cookie', buyer.cookie)).status).toBe(200)
    expect((await get(`/api/orders/${order.orderNumber}`).set('Cookie', owner.cookie)).status).toBe(200)
    expect((await get(`/api/orders/${order.orderNumber}`).set('Cookie', stranger.cookie)).status).toBe(404)
  })

  it('"my orders" shows only my own, newest first', async () => {
    const alice = makeUser('CUSTOMER', 'alice@example.com')
    const bob = makeUser('CUSTOMER', 'bob@example.com')
    await place({}, alice.cookie)
    await place({}, bob.cookie)
    await place({ deliverySlot: 'evening' }, alice.cookie)

    expect((await get('/api/me/orders')).status).toBe(401)
    const res = await get('/api/me/orders').set('Cookie', alice.cookie)
    expect(res.status).toBe(200)
    expect(res.body.map((o: any) => o.orderNumber)).toEqual(['CP-1052', 'CP-1050'])
    expect(res.headers['cache-control']).toBe('no-store')
  })
})

describe('POST /api/orders/track', () => {
  const track = (orderNumber: string, phone: string) => post('/api/orders/track').send({ orderNumber, phone })

  it('finds an order by number plus the customer\'s or the recipient\'s phone, in any format', async () => {
    await post('/api/orders').send(baseOrder())
    for (const [number, phone] of [['CP-1050', '0771234567'], ['cp-1050', '+94 77 123 4567'], ['#1050', '94771234567'], ['1050', '071 555 6666'], ['CP-1050', '0715556666']]) {
      const res = await track(number!, phone!)
      expect(res.status, `${number} / ${phone}`).toBe(200)
      expect(res.body.orderNumber).toBe('CP-1050')
    }
  })

  it('gives the same answer for a wrong phone and an unknown order', async () => {
    await post('/api/orders').send(baseOrder())
    const wrongPhone = await track('CP-1050', '0700000000')
    const unknown = await track('CP-4000', '0771234567')
    expect(wrongPhone.status).toBe(404)
    expect(wrongPhone.body).toEqual(unknown.body)
    expect(wrongPhone.body.error.message).toMatch(/couldn't find an order/)
  })

  it('slows down people trying many numbers (429)', async () => {
    const statuses: number[] = []
    for (let i = 0; i < 20; i++) {
      statuses.push((await post('/api/orders/track').set('x-test-limit', '1').send({ orderNumber: `CP-${2000 + i}`, phone: '0771234567' })).status)
    }
    expect(statuses.slice(0, 15).every((s) => s === 404)).toBe(true)
    expect(statuses.slice(15).every((s) => s === 429)).toBe(true)
  })
})

describe('order rate limit', () => {
  it('stops one address placing more than 20 orders an hour', async () => {
    products.find((p) => p.id === ID.slow)!.stock = 100
    const statuses: number[] = []
    for (let i = 0; i < 22; i++) {
      statuses.push((await post('/api/orders').set('x-test-limit', '1').send(baseOrder({ items: [{ productId: ID.slow, quantity: 1 }] }))).status)
    }
    expect(statuses.slice(0, 20).every((s) => s === 201)).toBe(true)
    expect(statuses.slice(20)).toEqual([429, 429])
  })
})
