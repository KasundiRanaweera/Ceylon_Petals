import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

vi.mock('../lib/prisma.js', async () => ({ prisma: (await import('./helpers/testDb.js')).prisma }))

const { prisma, resetDb, makeUser } = await import('./helpers/testDb.js')
const { createApp } = await import('../app.js')
const { initialsOf } = await import('../services/reviews.js')

const ORIGIN = 'http://localhost:5173'
const app = createApp()
let owner: { cookie: string }

const admin = (method: 'get' | 'post' | 'patch' | 'delete', path = '') =>
  request(app)[method](`/api/admin/reviews${path}`).set('Origin', ORIGIN).set('Cookie', owner.cookie)

const review = (over: Record<string, unknown> = {}) => ({
  name: 'Nimali Perera',
  location: 'Colombo 07',
  rating: 5,
  message: 'Beautiful roses, delivered on time.',
  orderedItem: "Ordered 'Classic Red Rose Dozen'",
  ...over,
})

beforeEach(async () => {
  await resetDb()
  owner = await makeUser('OWNER')
})

describe('public reviews', () => {
  it('shows only published reviews, in the owner order, with the average rating', async () => {
    await prisma.review.createMany({
      data: [
        { ...review({ name: 'Second' }), sortOrder: 2 },
        { ...review({ name: 'First', rating: 4 }), sortOrder: 1 },
        { ...review({ name: 'Hidden', rating: 1 }), sortOrder: 0, isPublished: false },
      ],
    })
    const res = await request(app).get('/api/reviews')
    expect(res.status).toBe(200)
    expect(res.body.reviews.map((r: { name: string }) => r.name)).toEqual(['First', 'Second'])
    expect(res.body).toMatchObject({ count: 2, average: 4.5 })
    expect(res.body.reviews[0].initials).toBe('F')
  })

  it('returns an empty list and a zero average when there are none', async () => {
    expect((await request(app).get('/api/reviews')).body).toEqual({ reviews: [], average: 0, count: 0 })
  })
})

describe('owner manages reviews', () => {
  it('adds, edits, hides and deletes a review', async () => {
    const created = await admin('post').send(review())
    expect(created.status).toBe(201)
    expect(created.body).toMatchObject({ name: 'Nimali Perera', initials: 'NP', isPublished: true, sortOrder: 0 })
    const id = created.body.id

    const edited = await admin('patch', `/${id}`).send({ rating: 4, isPublished: false })
    expect(edited.body).toMatchObject({ rating: 4, isPublished: false, message: 'Beautiful roses, delivered on time.' })
    expect((await request(app).get('/api/reviews')).body.count).toBe(0)
    expect((await admin('get')).body).toHaveLength(1)

    expect((await admin('delete', `/${id}`)).status).toBe(204)
    expect((await admin('get')).body).toHaveLength(0)
    expect((await admin('delete', `/${id}`)).status).toBe(404)
  })

  it('rejects bad input', async () => {
    expect((await admin('post').send(review({ rating: 6 }))).status).toBe(400)
    expect((await admin('post').send(review({ rating: 0 }))).status).toBe(400)
    expect((await admin('post').send(review({ message: '   ' }))).status).toBe(400)
    expect((await admin('post').send(review({ name: '' }))).status).toBe(400)
    expect((await admin('post').send(review({ message: 'x'.repeat(601) }))).status).toBe(400)
    expect((await admin('patch', '/not-a-uuid').send({ rating: 3 })).status).toBe(400)
    expect((await admin('patch', '/3f1c1b8e-9a51-4f2a-8f37-0d8a8e2b0a11').send({ rating: 3 })).status).toBe(404)
  })

  it('is closed to guests and customers', async () => {
    const customer = await makeUser('CUSTOMER')
    for (const [method, path] of [['get', ''], ['post', ''], ['patch', '/x'], ['delete', '/x']] as const) {
      const guest = await request(app)[method](`/api/admin/reviews${path}`).set('Origin', ORIGIN).send(review())
      expect(guest.status).toBe(401)
      const signedIn = await request(app)[method](`/api/admin/reviews${path}`).set('Origin', ORIGIN).set('Cookie', customer.cookie).send(review())
      expect(signedIn.status).toBe(403)
    }
  })
})

describe('initials', () => {
  it('uses the first letters of the first two names', () => {
    expect(initialsOf('Dilshan Karunaratne')).toBe('DK')
    expect(initialsOf('  ananya  ')).toBe('A')
    expect(initialsOf('Tharushi de Silva Perera')).toBe('TD')
  })
})
