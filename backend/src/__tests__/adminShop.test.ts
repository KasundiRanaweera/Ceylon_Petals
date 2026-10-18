import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

vi.mock('../lib/prisma.js', async () => ({ prisma: (await import('./helpers/testDb.js')).prisma }))

const { prisma, resetDb, seedShop, makeProduct, makeOrder, makeUser } = await import('./helpers/testDb.js')
const { createApp } = await import('../app.js')
const { buildAnalytics } = await import('../services/analytics.js')

const ORIGIN = 'http://localhost:5173'
const app = createApp()
let owner: { cookie: string }

const admin = (method: 'get' | 'post' | 'put' | 'patch' | 'delete', path: string) => request(app)[method](`/api/admin${path}`).set('Origin', ORIGIN).set('Cookie', owner.cookie)

beforeEach(async () => {
  await resetDb()
  await seedShop()
  owner = await makeUser('OWNER')
})

describe('owner-only guard', () => {
  const routes: [string, string][] = [
    ['get', '/orders'], ['get', '/orders/1050'], ['patch', '/orders/1050/status'], ['patch', '/orders/1050/payment'],
    ['get', '/products'], ['post', '/products'], ['get', '/products/x'], ['put', '/products/x'], ['delete', '/products/x'],
    ['patch', '/products/x/active'], ['patch', '/products/x/stock'],
    ['get', '/categories'], ['post', '/categories'], ['put', '/categories/x'], ['delete', '/categories/x'],
    ['get', '/customers'], ['get', '/inquiries'], ['patch', '/inquiries/x'],
    ['get', '/settings'], ['patch', '/settings'], ['get', '/analytics'], ['post', '/uploads/sign'],
  ]

  it.each(routes)('%s %s: guests get 401, customers get 403', async (method, path) => {
    const customer = await makeUser('CUSTOMER')
    const guest = await (request(app) as any)[method](`/api/admin${path}`).set('Origin', ORIGIN).send({})
    expect(guest.status).toBe(401)
    const signedIn = await (request(app) as any)[method](`/api/admin${path}`).set('Origin', ORIGIN).set('Cookie', customer.cookie).send({})
    expect(signedIn.status).toBe(403)
  })
})

describe('settings', () => {
  it('returns everything, including inactive zones and promo codes', async () => {
    const res = await admin('get', '/settings')
    expect(res.body).toMatchObject({ shopName: 'Ceylon Petals', sameDayCutoff: '14:00', acceptingOrders: true, freeDeliveryOver: 25000 })
    expect(res.body.deliveryZones.map((z: { district: string }) => z.district)).toEqual(['Colombo', 'Galle', 'Kandy'])
    expect(res.body.promoCodes[0]).toMatchObject({ code: 'WELCOME10', type: 'PERCENT', value: 10 })
  })

  it('changes only what is sent', async () => {
    const res = await admin('patch', '/settings').send({ acceptingOrders: false })
    expect(res.body.acceptingOrders).toBe(false)
    expect(res.body.shopName).toBe('Ceylon Petals')
    expect((await request(app).get('/api/settings')).body.acceptingOrders).toBe(false)
  })

  it('updates details, normalises WhatsApp, and checks the cutoff time', async () => {
    const res = await admin('patch', '/settings').send({ whatsappNumber: '077 555 1234', sameDayCutoff: '13:30', shopName: 'New Name' })
    expect(res.body).toMatchObject({ whatsappNumber: '94775551234', sameDayCutoff: '13:30', shopName: 'New Name' })
    expect((await admin('patch', '/settings').send({ sameDayCutoff: '25:00' })).status).toBe(400)
    expect((await admin('patch', '/settings').send({ freeDeliveryOver: -1 })).status).toBe(400)
    expect((await admin('patch', '/settings').send({ whatsappNumber: 'abc' })).status).toBe(400)
  })

  it('replaces the zone list as a whole', async () => {
    const res = await admin('patch', '/settings').send({
      deliveryZones: [{ district: 'Colombo', fee: 600, sameDay: true, active: true }, { district: 'Matara', fee: 2000, sameDay: false, active: true }],
    })
    expect(res.body.deliveryZones.map((z: { district: string; fee: number }) => [z.district, z.fee])).toEqual([['Colombo', 600], ['Matara', 2000]])
    expect((await admin('patch', '/settings').send({ deliveryZones: [{ district: 'Atlantis', fee: 1, sameDay: false, active: true }] })).status).toBe(400)
    const dup = { district: 'Colombo', fee: 1, sameDay: false, active: true }
    expect((await admin('patch', '/settings').send({ deliveryZones: [dup, dup] })).status).toBe(400)
  })

  it('replaces the promo list, upper-cases codes and checks the rules', async () => {
    const ok = await admin('patch', '/settings').send({ promoCodes: [{ code: 'eid15', type: 'PERCENT', value: 15, minOrder: 5000, active: true, description: 'Eid' }] })
    expect(ok.body.promoCodes.map((p: { code: string }) => p.code)).toEqual(['EID15'])
    const send = (promo: object) => admin('patch', '/settings').send({ promoCodes: [{ code: 'X123', type: 'PERCENT', value: 10, minOrder: 0, active: true, description: '', ...promo }] })
    expect((await send({ value: 150 })).status).toBe(400)
    expect((await send({ value: 0 })).status).toBe(400)
    expect((await send({ code: 'a b' })).status).toBe(400)
    expect((await send({ type: 'FIXED', value: 500 })).status).toBe(200)
    expect((await admin('patch', '/settings').send({ promoCodes: [{ code: 'X123', type: 'FIXED', value: 5, active: true }, { code: 'x123', type: 'FIXED', value: 5, active: true }] })).status).toBe(400)
  })

  it('saves the announcement and social links, and the shop shows them', async () => {
    const res = await admin('patch', '/settings').send({
      announcement: '  Avurudu orders open: 10% off hampers  ',
      instagramUrl: 'https://www.instagram.com/ceylonpetals',
      facebookUrl: 'https://facebook.com/ceylonpetals',
      tiktokUrl: '',
    })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ announcement: 'Avurudu orders open: 10% off hampers', instagramUrl: 'https://www.instagram.com/ceylonpetals', tiktokUrl: '' })
    const shop = (await request(app).get('/api/settings')).body
    expect(shop).toMatchObject({ announcement: 'Avurudu orders open: 10% off hampers', facebookUrl: 'https://facebook.com/ceylonpetals' })
  })

  it('refuses social links that are not https links to that network, and over-long announcements', async () => {
    for (const bad of [
      { instagramUrl: 'http://instagram.com/x' },
      { instagramUrl: 'https://evil.example/instagram.com' },
      { instagramUrl: 'javascript:alert(1)' },
      { facebookUrl: 'https://notfacebook.com/x' },
      { tiktokUrl: 'tiktok.com/@x' },
      { announcement: 'x'.repeat(161) },
    ]) {
      expect((await admin('patch', '/settings').send(bad)).status, JSON.stringify(bad)).toBe(400)
    }
  })

  it('a bad list changes nothing', async () => {
    await admin('patch', '/settings').send({ shopName: 'Changed', promoCodes: [{ code: 'X123', type: 'PERCENT', value: 500, active: true }] })
    expect((await admin('get', '/settings')).body.shopName).toBe('Ceylon Petals')
  })
})

describe('inquiries', () => {
  const valid = { type: 'WEDDING', name: 'Nimali', email: 'nimali@example.com', phone: '077 123 4567', eventDate: '2027-02-14', details: 'Church flowers for 200 guests', extra: { Ceremony: 'Church' } }

  it('anyone can send one, and gets a reference', async () => {
    const res = await request(app).post('/api/inquiries').set('Origin', ORIGIN).send(valid)
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ reference: 'INQ-104', type: 'WEDDING', status: 'NEW', phone: '94771234567', eventDate: '2027-02-14', extra: { Ceremony: 'Church' } })
    expect((await request(app).post('/api/inquiries').set('Origin', ORIGIN).send(valid)).body.reference).toBe('INQ-105')
  })

  it('treats empty optional fields as not given, and rejects bad ones', async () => {
    const res = await request(app).post('/api/inquiries').set('Origin', ORIGIN).send({ ...valid, eventDate: '', budget: '', location: ' ' })
    expect(res.status).toBe(201)
    expect(res.body.eventDate).toBeUndefined()
    for (const bad of [{ type: 'PARTY' }, { name: '' }, { email: 'nope' }, { phone: '12' }, { details: '' }]) {
      expect((await request(app).post('/api/inquiries').set('Origin', ORIGIN).send({ ...valid, ...bad })).status, JSON.stringify(bad)).toBe(400)
    }
  })

  it('refuses requests from other websites', async () => {
    expect((await request(app).post('/api/inquiries').set('Origin', 'https://evil.example').send(valid)).status).toBe(403)
  })

  it('the owner reads them newest first and updates status and notes', async () => {
    await request(app).post('/api/inquiries').set('Origin', ORIGIN).send(valid)
    await request(app).post('/api/inquiries').set('Origin', ORIGIN).send({ ...valid, name: 'Second' })
    const list = await admin('get', '/inquiries')
    expect(list.body.map((i: { reference: string }) => i.reference)).toEqual(['INQ-105', 'INQ-104'])

    const id = list.body[0].id
    const res = await admin('patch', `/inquiries/${id}`).send({ status: 'QUOTED', ownerNotes: 'Sent quote 180,000' })
    expect(res.body).toMatchObject({ status: 'QUOTED', ownerNotes: 'Sent quote 180,000' })
    const cleared = await admin('patch', `/inquiries/${id}`).send({ ownerNotes: '' })
    expect(cleared.body.ownerNotes).toBeUndefined()
    expect(cleared.body.status).toBe('QUOTED')
    expect((await admin('patch', `/inquiries/${id}`).send({ status: 'DONE' })).status).toBe(400)
    expect((await admin('patch', '/inquiries/11111111-1111-4111-8111-111111111111').send({ status: 'CLOSED' })).status).toBe(404)
  })
})

describe('customers', () => {
  it('combines accounts and guests by phone, and counts only paid orders as spent', async () => {
    const { user } = await makeUser('CUSTOMER', { name: 'Registered Ruwan', phone: '94771111111', email: 'ruwan@example.com' })
    await makeOrder({ userId: user.id, total: 5000, paymentStatus: 'PAID', createdAt: new Date('2026-10-01T05:00:00Z') })
    await makeOrder({ userId: null, customerName: 'Ruwan as guest', customerPhone: '94771111111', total: 3000, createdAt: new Date('2026-10-05T05:00:00Z') }) // same phone, unpaid
    await makeOrder({ customerName: 'Guest Gayani', customerPhone: '94772222222', total: 7000, paymentStatus: 'PAID' })

    const list = (await admin('get', '/customers')).body as { name: string; registered: boolean; orders: number; totalSpent: number; lastOrderAt?: string }[]
    expect(list).toHaveLength(2)
    const ruwan = list.find((c) => c.registered)!
    expect(ruwan).toMatchObject({ name: 'Registered Ruwan', orders: 2, totalSpent: 5000, lastOrderAt: '2026-10-05T05:00:00.000Z' })
    expect(list.find((c) => !c.registered)).toMatchObject({ name: 'Guest Gayani', orders: 1, totalSpent: 7000 })
  })

  it('does not list the owner, and shows accounts with no orders', async () => {
    await makeUser('CUSTOMER', { name: 'Lonely', phone: '94773333333' })
    const list = (await admin('get', '/customers')).body
    expect(list.map((c: { name: string }) => c.name)).toEqual(['Lonely'])
    expect(list[0]).toMatchObject({ orders: 0, totalSpent: 0 })
  })
})

describe('analytics', () => {
  const items = [{ productId: null, name: 'Roses', unitPrice: 5000, quantity: 1 }]
  const order = (over: Partial<Parameters<typeof buildAnalytics>[0][number]>) => ({
    createdAt: new Date('2026-10-10T06:00:00Z'), status: 'DELIVERED', paymentMethod: 'CARD' as const, district: 'Colombo', area: 'Col 7', total: 5500, items, ...over,
  })

  it('counts sales per Colombo day and leaves out cancelled and failed orders', () => {
    const result = buildAnalytics(
      [
        order({}),
        order({ createdAt: new Date('2026-10-09T19:00:00Z') }), // 00:30 on the 10th in Colombo
        order({ createdAt: new Date('2026-10-09T18:00:00Z') }), // 23:30 on the 9th in Colombo
        order({ status: 'CANCELLED' }),
        order({ status: 'PAYMENT_FAILED' }),
      ],
      '2026-10-10', 3,
    )
    expect(result).toMatchObject({ from: '2026-10-08', to: '2026-10-10', sales: 16500, orders: 3, averageOrder: 5500, cancelled: 2 })
    expect(result.daily).toEqual([
      { date: '2026-10-08', orders: 0, sales: 0 },
      { date: '2026-10-09', orders: 1, sales: 5500 },
      { date: '2026-10-10', orders: 2, sales: 11000 },
    ])
  })

  it('compares with the period before, and groups products, payments and districts', () => {
    const result = buildAnalytics(
      [
        order({ total: 10000, paymentMethod: 'WHATSAPP', district: 'Kandy', items: [{ productId: 'p1', name: 'Lilies', unitPrice: 2500, quantity: 4 }] }),
        order({ createdAt: new Date('2026-10-07T06:00:00Z'), total: 5000 }), // previous period (days=3: Oct 5-7)
        order({ createdAt: new Date('2026-09-01T06:00:00Z'), total: 99999 }), // too old
      ],
      '2026-10-10', 3,
    )
    expect(result.previousSales).toBe(5000)
    expect(result.changePct).toBe(100)
    expect(result.topProducts[0]).toEqual({ name: 'Lilies', quantity: 4, revenue: 10000 })
    expect(result.byPaymentMethod).toEqual({ CARD: 0, CASH_ON_DELIVERY: 0, WHATSAPP: 10000 })
    expect(result.byDistrict).toEqual([{ district: 'Kandy', orders: 1, sales: 10000 }])
  })

  it('has no percentage when there is nothing to compare, and copes with no orders', () => {
    expect(buildAnalytics([order({})], '2026-10-10', 3).changePct).toBeNull()
    const empty = buildAnalytics([], '2026-10-10', 7)
    expect(empty).toMatchObject({ sales: 0, orders: 0, averageOrder: 0, changePct: null, topProducts: [], byDistrict: [] })
    expect(empty.daily).toHaveLength(7)
  })

  it('works through the API from real orders', async () => {
    const p = await makeProduct({ slug: 'roses', name: 'Roses' })
    await makeOrder({ total: 6000, items: [{ productId: p.id, name: 'Roses', unitPrice: 5500, quantity: 1 }] })
    const res = await admin('get', '/analytics?days=7')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ days: 7, orders: 1, sales: 6000 })
    expect(res.body.topProducts[0].name).toBe('Roses')
    expect((await admin('get', '/analytics?days=0')).status).toBe(400)
    expect((await admin('get', '/analytics?days=400')).status).toBe(400)
    expect((await admin('get', '/analytics')).body.days).toBe(30)
  })
})

it('keeps the database tidy between tests', async () => {
  expect(await prisma.order.count()).toBe(0)
})
