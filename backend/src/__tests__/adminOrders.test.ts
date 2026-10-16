import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

// Real Prisma + a real in-memory PostgreSQL built from the project's migrations.
vi.mock('../lib/prisma.js', async () => ({ prisma: (await import('./helpers/testDb.js')).prisma }))

const { prisma, resetDb, seedShop, makeProduct, makeOrder, makeUser } = await import('./helpers/testDb.js')
const { createApp } = await import('../app.js')

const ORIGIN = 'http://localhost:5173'
const app = createApp()
let owner: { cookie: string }

const call = (method: 'get' | 'patch', path: string, cookie = owner.cookie) => request(app)[method](`/api/admin${path}`).set('Origin', ORIGIN).set('Cookie', cookie)
const stock = async (id: string) => (await prisma.product.findUniqueOrThrow({ where: { id } })).stock
const history = async (number: number) => (await prisma.orderStatusHistory.findMany({ where: { order: { number } }, orderBy: { createdAt: 'asc' } })).map((h) => h.status)

beforeEach(async () => {
  await resetDb()
  await seedShop()
  owner = await makeUser('OWNER')
})

describe('reading orders', () => {
  it('lists orders newest first in the shape the owner pages use', async () => {
    const roses = await makeProduct({ slug: 'roses', name: 'Roses' })
    await makeOrder({ items: [{ productId: roses.id, name: 'Roses', unitPrice: 10000, quantity: 2 }], createdAt: new Date('2026-10-01T05:00:00Z') })
    await makeOrder({ customerName: 'Second', createdAt: new Date('2026-10-02T05:00:00Z') })

    const res = await call('get', '/orders')
    expect(res.status).toBe(200)
    expect(res.body.map((o: { orderNumber: string }) => o.orderNumber)).toEqual(['CP-1051', 'CP-1050'])
    expect(res.body[1]).toMatchObject({ id: '1050', status: 'PENDING', paymentStatus: 'PENDING', deliveryDate: '2026-12-25', deliverySlot: 'morning', itemsSummary: 'Roses × 2' })
    expect(res.headers['cache-control']).toBe('no-store')
  })

  it('can limit how many and how far back', async () => {
    await makeOrder({ createdAt: new Date('2026-09-01T05:00:00Z') })
    await makeOrder({ createdAt: new Date('2026-10-10T05:00:00Z') })
    await makeOrder({ createdAt: new Date('2026-10-11T05:00:00Z') })
    expect((await call('get', '/orders?limit=2')).body).toHaveLength(2)
    expect((await call('get', '/orders?since=2026-10-10')).body).toHaveLength(2)
    expect((await call('get', '/orders?since=nonsense')).status).toBe(400)
  })

  it('opens one order by its number, with its history', async () => {
    await makeOrder()
    const res = await call('get', '/orders/1050')
    expect(res.body.statusHistory.map((h: { status: string }) => h.status)).toEqual(['PENDING'])
    expect((await call('get', '/orders/9999')).status).toBe(404)
    expect((await call('get', '/orders/CP-1050')).status).toBe(200)
  })
})

describe('changing the order status', () => {
  it('moves an order through the stages and records each step', async () => {
    await makeOrder()
    for (const status of ['CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED']) {
      const res = await call('patch', '/orders/1050/status').send({ status })
      expect(res.status).toBe(200)
      expect(res.body.status).toBe(status)
    }
    expect(await history(1050)).toEqual(['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'])
  })

  it('does nothing (and adds no history) when the status is unchanged', async () => {
    await makeOrder()
    await call('patch', '/orders/1050/status').send({ status: 'PENDING' })
    expect(await history(1050)).toEqual(['PENDING'])
  })

  it('cancelling puts the stock back, and only once', async () => {
    const roses = await makeProduct({ slug: 'roses', stock: 3 }) // 2 are already in the order
    await makeOrder({ items: [{ productId: roses.id, name: 'Roses', unitPrice: 10000, quantity: 2 }] })
    expect((await call('patch', '/orders/1050/status').send({ status: 'CANCELLED' })).status).toBe(200)
    expect(await stock(roses.id)).toBe(5)
    await call('patch', '/orders/1050/status').send({ status: 'CANCELLED' })
    expect(await stock(roses.id)).toBe(5)
  })

  it('reopening a cancelled order takes the stock again, or refuses when it has gone', async () => {
    const roses = await makeProduct({ slug: 'roses', stock: 5 })
    await makeOrder({ status: 'CANCELLED', items: [{ productId: roses.id, name: 'Roses', unitPrice: 10000, quantity: 2 }] })

    const ok = await call('patch', '/orders/1050/status').send({ status: 'CONFIRMED' })
    expect(ok.status).toBe(200)
    expect(await stock(roses.id)).toBe(3)

    await call('patch', '/orders/1050/status').send({ status: 'CANCELLED' })
    await prisma.product.update({ where: { id: roses.id }, data: { stock: 1 } })
    const refused = await call('patch', '/orders/1050/status').send({ status: 'CONFIRMED' })
    expect(refused.status).toBe(422)
    expect(refused.body.error.message).toMatch(/not enough stock of "Roses"/)
    expect((await call('get', '/orders/1050')).body.status).toBe('CANCELLED')
    expect(await stock(roses.id)).toBe(1)
  })

  it('a failed reopen of a multi-item order changes nothing at all', async () => {
    const a = await makeProduct({ slug: 'a', stock: 5 })
    const b = await makeProduct({ slug: 'b', stock: 0 })
    await makeOrder({
      status: 'CANCELLED',
      items: [
        { productId: a.id, name: 'A', unitPrice: 1000, quantity: 2 },
        { productId: b.id, name: 'B', unitPrice: 1000, quantity: 1 },
      ],
    })
    const res = await call('patch', '/orders/1050/status').send({ status: 'CONFIRMED' })
    expect(res.status).toBe(422)
    expect(await stock(a.id)).toBe(5) // A was taken first, then B failed: A was rolled back
    expect(await history(1050)).toEqual(['CANCELLED'])
  })

  it('custom hampers (no product) never touch stock', async () => {
    await makeOrder({ items: [{ productId: null, name: 'Custom-built hamper', unitPrice: 24000, quantity: 1 }] })
    expect((await call('patch', '/orders/1050/status').send({ status: 'CANCELLED' })).status).toBe(200)
  })

  it('a failed-payment order can be cancelled without giving the stock back twice', async () => {
    const roses = await makeProduct({ slug: 'roses', stock: 5 })
    await makeOrder({ status: 'PAYMENT_FAILED', paymentStatus: 'FAILED', paymentMethod: 'CARD', items: [{ productId: roses.id, name: 'Roses', unitPrice: 10000, quantity: 2 }] })
    expect((await call('patch', '/orders/1050/status').send({ status: 'CANCELLED' })).status).toBe(200)
    expect(await stock(roses.id)).toBe(5) // already released when the payment failed
  })

  it('the owner cannot set the payment-system status or invent one', async () => {
    await makeOrder()
    expect((await call('patch', '/orders/1050/status').send({ status: 'PAYMENT_FAILED' })).status).toBe(400)
    expect((await call('patch', '/orders/1050/status').send({ status: 'SHIPPED' })).status).toBe(400)
    expect((await call('patch', '/orders/1050/status').send({})).status).toBe(400)
  })

  it('an unpaid card order cannot be prepared or sent, but can wait or be cancelled', async () => {
    await makeOrder({ paymentMethod: 'CARD', paymentStatus: 'PENDING' })
    const refused = await call('patch', '/orders/1050/status').send({ status: 'PREPARING' })
    expect(refused.status).toBe(422)
    expect(refused.body.error.message).toMatch(/not been paid yet/)
    expect((await call('patch', '/orders/1050/status').send({ status: 'CANCELLED' })).status).toBe(200)
  })

  it('a paid card order moves on normally', async () => {
    await makeOrder({ paymentMethod: 'CARD', paymentStatus: 'PAID' })
    expect((await call('patch', '/orders/1050/status').send({ status: 'PREPARING' })).status).toBe(200)
  })

  it('unknown orders are 404', async () => {
    expect((await call('patch', '/orders/4040/status').send({ status: 'CONFIRMED' })).status).toBe(404)
    expect((await call('patch', '/orders/abc/status').send({ status: 'CONFIRMED' })).status).toBe(404)
  })
})

describe('recording payments made outside the website', () => {
  it('cash on delivery: unpaid -> paid -> unpaid again (mistake) ', async () => {
    await makeOrder({ paymentMethod: 'CASH_ON_DELIVERY' })
    const paid = await call('patch', '/orders/1050/payment').send({ paymentStatus: 'PAID' })
    expect(paid.body.paymentStatus).toBe('PAID')
    const row = await prisma.order.findUniqueOrThrow({ where: { number: 1050 } })
    expect(row.paidAt).toBeInstanceOf(Date)

    const undone = await call('patch', '/orders/1050/payment').send({ paymentStatus: 'PENDING' })
    expect(undone.body.paymentStatus).toBe('PENDING')
    expect((await prisma.order.findUniqueOrThrow({ where: { number: 1050 } })).paidAt).toBeNull()
  })

  it('WhatsApp orders work the same way', async () => {
    await makeOrder({ paymentMethod: 'WHATSAPP' })
    expect((await call('patch', '/orders/1050/payment').send({ paymentStatus: 'PAID' })).body.paymentStatus).toBe('PAID')
  })

  it('a cancelled paid order can be marked refunded', async () => {
    await makeOrder({ status: 'CANCELLED', paymentStatus: 'PAID', paymentMethod: 'CARD' })
    expect((await call('patch', '/orders/1050/payment').send({ paymentStatus: 'REFUNDED' })).body.paymentStatus).toBe('REFUNDED')
  })

  it('only a paid order can be refunded', async () => {
    await makeOrder()
    const res = await call('patch', '/orders/1050/payment').send({ paymentStatus: 'REFUNDED' })
    expect(res.status).toBe(422)
    expect(res.body.error.message).toBe('Only a paid order can be marked as refunded.')
  })

  it('card payments can never be marked paid or unpaid by hand', async () => {
    await makeOrder({ paymentMethod: 'CARD', paymentStatus: 'PENDING' })
    const paid = await call('patch', '/orders/1050/payment').send({ paymentStatus: 'PAID' })
    expect(paid.status).toBe(422)
    expect(paid.body.error.message).toBe('Card payments are confirmed automatically by PayHere.')
    await makeOrder({ paymentMethod: 'CARD', paymentStatus: 'PAID' })
    expect((await call('patch', '/orders/1051/payment').send({ paymentStatus: 'PENDING' })).status).toBe(422)
  })

  it('an already paid order cannot be paid again, and FAILED is not an owner choice', async () => {
    await makeOrder({ paymentStatus: 'PAID' })
    expect((await call('patch', '/orders/1050/payment').send({ paymentStatus: 'PAID' })).status).toBe(200) // no change
    expect((await call('patch', '/orders/1050/payment').send({ paymentStatus: 'FAILED' })).status).toBe(400)
  })
})
