import { createHash, randomUUID } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

// ---------------------------------------------------------------- in-memory database
interface ItemRow { id: string; productId: string | null; name: string; slug: string | null; imageUrl: string | null; unitPrice: number; quantity: number; options: string | null; position: number }
type OrderRow = Record<string, any> & { items: ItemRow[]; history: { id: string; status: string; createdAt: Date }[] }
interface ProductRow { id: string; name: string; stock: number; isActive: boolean }
interface UserRow { id: string; name: string; email: string; phone: string; role: 'CUSTOMER' | 'OWNER'; tokenVersion: number; createdAt: Date }

let orders: OrderRow[] = []
let products: ProductRow[] = []
let users: UserRow[] = []
let nextNumber = 1050

const matches = (row: Record<string, any>, where: Record<string, any>) =>
  Object.entries(where).every(([key, cond]) => {
    const value = row[key]
    if (cond !== null && typeof cond === 'object' && !(cond instanceof Date)) {
      if ('not' in cond) return value !== cond.not
      if ('lt' in cond) return value < cond.lt
      if ('gte' in cond) return value >= cond.gte
    }
    return value === cond
  })

const prismaMock = {
  shopSettings: { findUnique: async () => ({ id: 1, shopName: 'Ceylon Petals', email: 'shop@ceylonpetals.lk' }) },
  order: {
    findUnique: async ({ where }: any) => orders.find((o) => (where.id ? o.id === where.id : o.number === where.number)) ?? null,
    findUniqueOrThrow: async ({ where }: any) => {
      const row = orders.find((o) => o.id === where.id)
      if (!row) throw new Error('not found')
      return row
    },
    findMany: async ({ where }: any) => orders.filter((o) => matches(o, where)),
    updateMany: async ({ where, data }: any) => {
      const rows = orders.filter((o) => matches(o, where))
      rows.forEach((o) => Object.assign(o, data, { updatedAt: new Date() }))
      return { count: rows.length }
    },
  },
  orderStatusHistory: {
    create: async ({ data }: any) => {
      orders.find((o) => o.id === data.orderId)!.history.push({ id: randomUUID(), status: data.status, createdAt: new Date() })
    },
  },
  product: {
    updateMany: async ({ where, data }: any) => {
      const rows = products.filter((p) => matches(p, where))
      for (const p of rows) {
        if (typeof data.stock === 'number') p.stock = data.stock
        else if (data.stock?.increment) p.stock += data.stock.increment
        else if (data.stock?.decrement) p.stock -= data.stock.decrement
      }
      return { count: rows.length }
    },
  },
  user: { findUnique: async ({ where }: any) => users.find((u) => u.id === where.id) ?? null },
  $transaction: async (fn: (tx: unknown) => Promise<unknown>) => {
    const snapshot = JSON.stringify({ orders, products })
    try {
      return await fn(prismaMock)
    } catch (error) {
      const before = JSON.parse(snapshot)
      const revive = (o: any) => ({ ...o, createdAt: new Date(o.createdAt), updatedAt: new Date(o.updatedAt), history: o.history.map((h: any) => ({ ...h, createdAt: new Date(h.createdAt) })) })
      orders = before.orders.map(revive)
      products = before.products
      throw error
    }
  },
}
vi.mock('../lib/prisma.js', () => ({ prisma: prismaMock }))

const { env } = await import('../config/env.js')
const { createApp } = await import('../app.js')
const { signOrderToken, signAuthToken } = await import('../lib/tokens.js')
const { checkoutHash, notifySignature, signaturesMatch, formatAmount } = await import('../lib/payhere.js')
const { expireUnpaidCardOrders } = await import('../services/payments.js')

// ---------------------------------------------------------------- helpers

const ORIGIN = 'http://localhost:5173'
const SECRET = 'test-merchant-secret'
const MERCHANT = '1230001'
const ROSES = randomUUID()
const LILIES = randomUUID()
const app = createApp()

const md5 = (text: string) => createHash('md5').update(text).digest('hex').toUpperCase()
const orderToken = (order: OrderRow) => signOrderToken(order.number)

function makeOrder(over: Record<string, unknown> = {}): OrderRow {
  const id = randomUUID()
  const number = nextNumber++
  const row: OrderRow = {
    id, number, userId: null, customerName: 'Amaya Fernando', customerPhone: '94771234567', customerEmail: 'amaya@example.com',
    isOverseas: false, recipientName: 'Dilini', recipientPhone: '94715556666', address: '12 Lake Road', area: 'Colombo 07',
    district: 'Colombo', deliveryDate: new Date('2026-10-25T00:00:00Z'), deliverySlot: 'MORNING', cardMessage: null, deliveryNotes: null,
    subtotal: 18150, deliveryFee: 500, discount: 0, promoCode: null, total: 18650, paymentMethod: 'CARD', paymentStatus: 'PENDING',
    paymentReference: null, paidAt: null, status: 'PENDING', createdAt: new Date(), updatedAt: new Date(),
    items: [{ id: randomUUID(), productId: ROSES, name: 'Crimson Roses', slug: 'roses', imageUrl: null, unitPrice: 9075, quantity: 2, options: null, position: 0 }],
    history: [{ id: randomUUID(), status: 'PENDING', createdAt: new Date() }],
    ...over,
  }
  orders.push(row)
  return row
}

/** A message exactly as PayHere would send it, correctly signed. */
function payhereMessage(order: OrderRow, over: Record<string, string> = {}) {
  const base = { merchant_id: MERCHANT, order_id: `CP-${order.number}`, payment_id: '320032500123', payhere_amount: formatAmount(order.total), payhere_currency: 'LKR', status_code: '2', ...over }
  return { ...base, md5sig: notifySignature({ merchantId: base.merchant_id, orderId: base.order_id, amount: base.payhere_amount, currency: base.payhere_currency, statusCode: base.status_code }, SECRET) }
}

const notify = (message: Record<string, string>) => request(app).post('/api/payments/payhere/notify').type('form').send(message)
const stockOf = (id: string) => products.find((p) => p.id === id)!.stock
const start = (order: OrderRow, token = orderToken(order)) => request(app).post('/api/payments/payhere/start').set('Origin', ORIGIN).set('X-Order-Token', token).send({ orderNumber: `CP-${order.number}` })

beforeEach(() => {
  orders = []
  users = []
  products = [{ id: ROSES, name: 'Crimson Roses', stock: 3, isActive: true }, { id: LILIES, name: 'Ivory Lilies', stock: 5, isActive: true }]
  nextNumber = 1050
  Object.assign(env.payhere, { mode: 'sandbox', merchantId: MERCHANT, merchantSecret: SECRET, checkoutUrl: 'https://sandbox.payhere.lk/pay/checkout', notifyUrl: 'https://api.example.com/api/payments/payhere/notify', returnBase: 'http://localhost:5173', windowMinutes: 30 })
})
afterEach(() => vi.restoreAllMocks())

// ---------------------------------------------------------------- signing

describe('PayHere signatures', () => {
  it('builds the checkout hash exactly as PayHere documents', () => {
    const expected = md5(`${MERCHANT}CP-1050${'18650.00'}LKR${md5(SECRET)}`)
    expect(checkoutHash({ merchantId: MERCHANT, orderId: 'CP-1050', amount: '18650.00', currency: 'LKR' }, SECRET)).toBe(expected)
  })

  it('builds the callback signature exactly as PayHere documents', () => {
    const expected = md5(`${MERCHANT}CP-1050${'18650.00'}LKR${'2'}${md5(SECRET)}`)
    expect(notifySignature({ merchantId: MERCHANT, orderId: 'CP-1050', amount: '18650.00', currency: 'LKR', statusCode: '2' }, SECRET)).toBe(expected)
  })

  it('writes amounts with two decimals and no separators', () => {
    expect(formatAmount(1500)).toBe('1500.00')
    expect(formatAmount(1234567)).toBe('1234567.00')
  })

  it('compares signatures safely (case and spaces do not matter, length mismatch is false)', () => {
    expect(signaturesMatch('ABC123', ' abc123 ')).toBe(true)
    expect(signaturesMatch('ABC123', 'ABC124')).toBe(false)
    expect(signaturesMatch('ABC123', 'ABC12')).toBe(false)
  })
})

// ---------------------------------------------------------------- start

describe('POST /api/payments/payhere/start', () => {
  it('returns the signed form PayHere needs', async () => {
    const order = makeOrder()
    const res = await start(order)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ mode: 'sandbox', action: 'https://sandbox.payhere.lk/pay/checkout', method: 'POST' })
    const f = res.body.fields
    expect(f).toMatchObject({
      merchant_id: MERCHANT, order_id: 'CP-1050', amount: '18650.00', currency: 'LKR', first_name: 'Amaya', last_name: 'Fernando',
      email: 'amaya@example.com', phone: '94771234567', city: 'Colombo 07', country: 'Sri Lanka',
      notify_url: 'https://api.example.com/api/payments/payhere/notify',
      return_url: 'http://localhost:5173/order-confirmation/CP-1050', cancel_url: 'http://localhost:5173/payment/CP-1050',
    })
    expect(f.hash).toBe(checkoutHash({ merchantId: MERCHANT, orderId: 'CP-1050', amount: '18650.00', currency: 'LKR' }, SECRET))
    expect(JSON.stringify(res.body)).not.toContain(SECRET)
  })

  it('uses the shop email when the customer gave none', async () => {
    const res = await start(makeOrder({ customerEmail: null }))
    expect(res.body.fields.email).toBe('shop@ceylonpetals.lk')
  })

  it('uses the live address in live mode', async () => {
    env.payhere.mode = 'live'
    env.payhere.checkoutUrl = 'https://www.payhere.lk/pay/checkout'
    const res = await start(makeOrder())
    expect(res.body).toMatchObject({ mode: 'live', action: 'https://www.payhere.lk/pay/checkout' })
  })

  it('needs access to the order (404 without the right token)', async () => {
    const order = makeOrder()
    const other = makeOrder()
    expect((await request(app).post('/api/payments/payhere/start').set('Origin', ORIGIN).send({ orderNumber: 'CP-1050' })).status).toBe(404)
    expect((await start(order, orderToken(other))).status).toBe(404)
  })

  it('refuses orders that are not payable by card, already paid, or cancelled', async () => {
    expect((await start(makeOrder({ paymentMethod: 'CASH_ON_DELIVERY' }))).body.error.message).toBe('This order is not paid by card.')
    expect((await start(makeOrder({ paymentStatus: 'PAID' }))).body.error.message).toBe('This order has already been paid.')
    expect((await start(makeOrder({ status: 'CANCELLED' }))).body.error.message).toBe('This order was cancelled.')
  })

  it('says so when card payment is switched off', async () => {
    env.payhere.mode = 'disabled'
    const res = await start(makeOrder())
    expect(res.status).toBe(503)
    expect(res.body.error.code).toBe('SERVICE_UNAVAILABLE')
  })

  it('does not hand out any form in simulated mode', async () => {
    env.payhere.mode = 'simulated'
    expect((await start(makeOrder())).body).toEqual({ mode: 'simulated' })
  })

  it('lets a customer retry after a failed payment: back to waiting, stock taken again', async () => {
    const order = makeOrder({ status: 'PAYMENT_FAILED', paymentStatus: 'FAILED' })
    products.find((p) => p.id === ROSES)!.stock = 3
    const res = await start(order)
    expect(res.status).toBe(200)
    expect(order.status).toBe('PENDING')
    expect(order.paymentStatus).toBe('PENDING')
    expect(stockOf(ROSES)).toBe(1) // 3 - 2
    expect(order.history.at(-1)!.status).toBe('PENDING')
  })

  it('refuses the retry (and changes nothing) when the stock has gone', async () => {
    const order = makeOrder({ status: 'PAYMENT_FAILED', paymentStatus: 'FAILED' })
    products.find((p) => p.id === ROSES)!.stock = 1
    const res = await start(order)
    expect(res.status).toBe(422)
    expect(res.body.error.message).toMatch(/Crimson Roses is no longer available/)
    // The failed retry was rolled back completely (read the row again: a rollback restores a fresh copy).
    const after = orders.find((o) => o.id === order.id)!
    expect(after.status).toBe('PAYMENT_FAILED')
    expect(after.paymentStatus).toBe('FAILED')
    expect(after.history).toHaveLength(1)
    expect(stockOf(ROSES)).toBe(1)
  })
})

// ---------------------------------------------------------------- notify

describe('POST /api/payments/payhere/notify', () => {
  it('marks the order paid when PayHere reports success', async () => {
    const order = makeOrder()
    const res = await notify(payhereMessage(order))
    expect(res.status).toBe(200)
    expect(res.text).toBe('OK')
    expect(order).toMatchObject({ paymentStatus: 'PAID', status: 'PENDING', paymentReference: '320032500123' })
    expect(order.paidAt).toBeInstanceOf(Date)
    expect(stockOf(ROSES)).toBe(3) // stock stays reserved
  })

  it('a forged message is rejected and changes nothing', async () => {
    const order = makeOrder()
    const message = payhereMessage(order)
    for (const bad of [{ ...message, md5sig: 'A'.repeat(32) }, { ...message, md5sig: '' }, { ...message, payhere_amount: '1.00' }, { ...message, status_code: '2', order_id: 'CP-9999' }]) {
      expect((await notify(bad)).status).toBe(400)
    }
    // signed with the wrong secret
    const forged = { ...message, md5sig: notifySignature({ merchantId: MERCHANT, orderId: message.order_id, amount: message.payhere_amount, currency: 'LKR', statusCode: '2' }, 'attacker-guess') }
    expect((await notify(forged)).status).toBe(400)
    expect(order.paymentStatus).toBe('PENDING')
  })

  it('rejects messages for a different merchant', async () => {
    const order = makeOrder()
    const other = payhereMessage(order, { merchant_id: '9999999' })
    expect((await notify(other)).status).toBe(400)
    expect(order.paymentStatus).toBe('PENDING')
  })

  it('rejects incomplete messages', async () => {
    const res = await notify({ merchant_id: MERCHANT, order_id: 'CP-1050' })
    expect(res.status).toBe(400)
  })

  it('is not available when card payments are not in sandbox or live mode', async () => {
    const order = makeOrder()
    for (const mode of ['simulated', 'disabled'] as const) {
      env.payhere.mode = mode
      expect((await notify(payhereMessage(order))).status).toBe(404)
    }
    expect(order.paymentStatus).toBe('PENDING')
  })

  it('does not mark the order paid when the amount or currency is wrong (but still answers OK)', async () => {
    const order = makeOrder()
    const cheap = await notify(payhereMessage(order, { payhere_amount: '100.00' }))
    expect(cheap.status).toBe(200)
    const wrongCurrency = await notify(payhereMessage(order, { payhere_currency: 'USD' }))
    expect(wrongCurrency.status).toBe(200)
    expect(order.paymentStatus).toBe('PENDING')
  })

  it('accepts amounts written as 18650.0 or 18650', async () => {
    const order = makeOrder()
    expect((await notify(payhereMessage(order, { payhere_amount: '18650.0' }))).status).toBe(200)
    expect(order.paymentStatus).toBe('PAID')
  })

  it('handles repeated notifications once', async () => {
    const order = makeOrder()
    const message = payhereMessage(order)
    await notify(message)
    const paidAt = order.paidAt
    await notify(message)
    await notify(message)
    expect(order.history).toHaveLength(1)
    expect(order.paidAt).toBe(paidAt)
    expect(stockOf(ROSES)).toBe(3)
  })

  it('answers OK for signed messages about unknown or non-card orders, and changes nothing', async () => {
    const cod = makeOrder({ paymentMethod: 'CASH_ON_DELIVERY' })
    expect((await notify(payhereMessage(cod))).status).toBe(200)
    expect(cod.paymentStatus).toBe('PENDING')
    const ghost = { ...cod, number: 7777 } as OrderRow
    expect((await notify(payhereMessage(ghost))).status).toBe(200)
  })

  describe('failed or cancelled payments', () => {
    for (const [label, code] of [['failed (-2)', '-2'], ['cancelled (-1)', '-1']] as const) {
      it(`${label}: marks the order failed and puts the stock back`, async () => {
        const order = makeOrder()
        products.find((p) => p.id === ROSES)!.stock = 1 // 2 were taken at checkout
        const res = await notify(payhereMessage(order, { status_code: code }))
        expect(res.status).toBe(200)
        expect(order).toMatchObject({ status: 'PAYMENT_FAILED', paymentStatus: 'FAILED' })
        expect(stockOf(ROSES)).toBe(3)
        expect(order.history.at(-1)!.status).toBe('PAYMENT_FAILED')
      })
    }

    it('a repeated failure does not give the stock back twice', async () => {
      const order = makeOrder()
      products.find((p) => p.id === ROSES)!.stock = 1
      const message = payhereMessage(order, { status_code: '-2' })
      await notify(message)
      await notify(message)
      expect(stockOf(ROSES)).toBe(3)
    })

    it('"still processing" (0) changes nothing', async () => {
      const order = makeOrder()
      await notify(payhereMessage(order, { status_code: '0' }))
      expect(order).toMatchObject({ status: 'PENDING', paymentStatus: 'PENDING' })
    })

    it('a failure never undoes an order that is already paid', async () => {
      const order = makeOrder()
      await notify(payhereMessage(order))
      await notify(payhereMessage(order, { status_code: '-2' }))
      expect(order).toMatchObject({ status: 'PENDING', paymentStatus: 'PAID' })
    })

    it('a failure does not touch an order the owner already cancelled', async () => {
      const order = makeOrder({ status: 'CANCELLED' })
      await notify(payhereMessage(order, { status_code: '-2' }))
      expect(order.status).toBe('CANCELLED')
      expect(order.paymentStatus).toBe('PENDING')
    })
  })

  describe('payments that arrive at an awkward time', () => {
    it('payment after the order expired: the order is revived and stock is taken again', async () => {
      const order = makeOrder({ status: 'PAYMENT_FAILED', paymentStatus: 'FAILED' })
      products.find((p) => p.id === ROSES)!.stock = 3
      await notify(payhereMessage(order))
      expect(order).toMatchObject({ status: 'PENDING', paymentStatus: 'PAID' })
      expect(stockOf(ROSES)).toBe(1)
      expect(order.history.at(-1)!.status).toBe('PENDING')
    })

    it('...and if the stock has gone, the customer still keeps the order and the shop is told', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const order = makeOrder({ status: 'PAYMENT_FAILED', paymentStatus: 'FAILED' })
      products.find((p) => p.id === ROSES)!.stock = 1
      await notify(payhereMessage(order))
      expect(order).toMatchObject({ status: 'PENDING', paymentStatus: 'PAID' })
      expect(stockOf(ROSES)).toBe(0) // never negative
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('short of stock'))
    })

    it('payment for an order the owner cancelled: stays cancelled but paid, so it shows as needing a refund', async () => {
      const order = makeOrder({ status: 'CANCELLED' })
      await notify(payhereMessage(order))
      expect(order).toMatchObject({ status: 'CANCELLED', paymentStatus: 'PAID' })
    })

    it('a chargeback marks a paid order as refunded', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const order = makeOrder({ paymentStatus: 'PAID' })
      await notify(payhereMessage(order, { status_code: '-3' }))
      expect(order.paymentStatus).toBe('REFUNDED')
      expect(warn).toHaveBeenCalled()
    })
  })
})

// ---------------------------------------------------------------- expiry

describe('expiring abandoned card orders', () => {
  const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000)

  it('fails stale unpaid card orders and puts their stock back', async () => {
    const stale = makeOrder({ updatedAt: minutesAgo(45) })
    products.find((p) => p.id === ROSES)!.stock = 1
    const count = await expireUnpaidCardOrders()
    expect(count).toBe(1)
    expect(stale).toMatchObject({ status: 'PAYMENT_FAILED', paymentStatus: 'FAILED' })
    expect(stockOf(ROSES)).toBe(3)
    expect(stale.history.at(-1)!.status).toBe('PAYMENT_FAILED')
  })

  it('leaves recent, paid, cash and WhatsApp orders alone', async () => {
    const recent = makeOrder({ updatedAt: minutesAgo(10) })
    const paid = makeOrder({ updatedAt: minutesAgo(90), paymentStatus: 'PAID' })
    const cod = makeOrder({ updatedAt: minutesAgo(90), paymentMethod: 'CASH_ON_DELIVERY' })
    const whatsapp = makeOrder({ updatedAt: minutesAgo(90), paymentMethod: 'WHATSAPP' })
    const confirmed = makeOrder({ updatedAt: minutesAgo(90), status: 'CONFIRMED' })
    expect(await expireUnpaidCardOrders()).toBe(0)
    for (const order of [recent, paid, cod, whatsapp, confirmed]) expect(order.status).not.toBe('PAYMENT_FAILED')
  })

  it('expires each order only once, even when run repeatedly', async () => {
    makeOrder({ updatedAt: minutesAgo(45) })
    products.find((p) => p.id === ROSES)!.stock = 1
    expect(await expireUnpaidCardOrders()).toBe(1)
    expect(await expireUnpaidCardOrders()).toBe(0)
    expect(stockOf(ROSES)).toBe(3)
  })

  it('respects the configured window', async () => {
    const order = makeOrder({ updatedAt: minutesAgo(20) })
    expect(await expireUnpaidCardOrders(new Date(), 30)).toBe(0)
    expect(await expireUnpaidCardOrders(new Date(), 15)).toBe(1)
    expect(order.status).toBe('PAYMENT_FAILED')
  })
})

// ---------------------------------------------------------------- simulated gateway

describe('POST /api/payments/dev/simulate', () => {
  const simulate = (order: OrderRow, outcome: string, token = orderToken(order)) =>
    request(app).post('/api/payments/dev/simulate').set('Origin', ORIGIN).set('X-Order-Token', token).send({ orderNumber: `CP-${order.number}`, outcome })

  beforeEach(() => {
    env.payhere.mode = 'simulated'
  })

  it('pays or fails an order in simulated mode', async () => {
    const paid = makeOrder()
    const res = await simulate(paid, 'success')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ orderNumber: 'CP-1050', paymentStatus: 'PAID', status: 'PENDING' })

    const failed = makeOrder()
    products.find((p) => p.id === ROSES)!.stock = 1
    const res2 = await simulate(failed, 'failed')
    expect(res2.body).toMatchObject({ status: 'PAYMENT_FAILED', paymentStatus: 'FAILED' })
    expect(stockOf(ROSES)).toBe(3)
  })

  it('needs access to that order', async () => {
    const order = makeOrder()
    const other = makeOrder()
    expect((await simulate(order, 'success', orderToken(other))).status).toBe(404)
    expect(order.paymentStatus).toBe('PENDING')
  })

  it('does not exist in sandbox, live or disabled mode (so it can never mark a real order paid)', async () => {
    const order = makeOrder()
    for (const mode of ['sandbox', 'live', 'disabled'] as const) {
      env.payhere.mode = mode
      expect((await simulate(order, 'success')).status, mode).toBe(404)
    }
    expect(order.paymentStatus).toBe('PENDING')
  })

  it('only works on card orders and validates the outcome', async () => {
    const cod = makeOrder({ paymentMethod: 'CASH_ON_DELIVERY' })
    expect((await simulate(cod, 'success')).status).toBe(422)
    expect((await simulate(makeOrder(), 'banana')).status).toBe(400)
  })

  it('a signed-in customer can simulate payment for their own order without a token', async () => {
    const user: UserRow = { id: randomUUID(), name: 'T', email: 't@example.com', phone: '94771234567', role: 'CUSTOMER', tokenVersion: 0, createdAt: new Date() }
    users.push(user)
    const mine = makeOrder({ userId: user.id })
    const res = await request(app).post('/api/payments/dev/simulate').set('Origin', ORIGIN).set('Cookie', `cp_session=${signAuthToken(user)}`).send({ orderNumber: `CP-${mine.number}`, outcome: 'success' })
    expect(res.status).toBe(200)
    expect(res.body.paymentStatus).toBe('PAID')
  })
})

describe('payment responses are private', () => {
  it('are never cached', async () => {
    const res = await start(makeOrder())
    expect(res.headers['cache-control']).toBe('no-store')
  })
})
