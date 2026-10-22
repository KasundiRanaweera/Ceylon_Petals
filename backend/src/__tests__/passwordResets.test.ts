import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import bcrypt from 'bcryptjs'

vi.mock('../lib/prisma.js', async () => ({ prisma: (await import('./helpers/testDb.js')).prisma }))

const { prisma, resetDb, makeUser } = await import('./helpers/testDb.js')
const { createApp } = await import('../app.js')
const { deleteOldPasswordResets, RESET_LINK_MINUTES } = await import('../services/passwordResets.js')

const ORIGIN = 'http://localhost:5173'
const app = createApp()
let owner: Awaited<ReturnType<typeof makeUser>>
let customer: Awaited<ReturnType<typeof makeUser>>

const makeLink = (id = customer.user.id, cookie = owner.cookie) =>
  request(app).post(`/api/admin/customers/${id}/password-reset`).set('Origin', ORIGIN).set('Cookie', cookie)
const check = (token: string) => request(app).post('/api/auth/password-reset/check').set('Origin', ORIGIN).send({ token })
const reset = (token: string, password = 'NewPassw0rd!') => request(app).post('/api/auth/password-reset').set('Origin', ORIGIN).send({ token, password })

beforeEach(async () => {
  await resetDb()
  owner = await makeUser('OWNER')
  customer = await makeUser('CUSTOMER', { name: 'Nimali Perera', email: 'nimali@example.com' })
})

describe('owner creates a password reset link', () => {
  it('gives a one-time token that lasts the set time, and stores only its hash', async () => {
    const res = await makeLink()
    expect(res.status).toBe(201)
    expect(res.body.token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(res.body.customer).toEqual({ name: 'Nimali Perera', email: 'nimali@example.com', phone: customer.user.phone })
    const minutes = (new Date(res.body.expiresAt).getTime() - Date.now()) / 60_000
    expect(minutes).toBeGreaterThan(RESET_LINK_MINUTES - 1)
    expect(minutes).toBeLessThanOrEqual(RESET_LINK_MINUTES)

    const rows = await prisma.passwordReset.findMany()
    expect(rows).toHaveLength(1)
    expect(rows[0]!.tokenHash).not.toContain(res.body.token)
    expect(rows[0]!.tokenHash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('cancels the older link when a new one is made', async () => {
    const first = (await makeLink()).body.token
    const second = (await makeLink()).body.token
    expect((await check(first)).status).toBe(422)
    expect((await check(second)).status).toBe(200)
  })

  it('is owner only', async () => {
    expect((await makeLink(customer.user.id, '')).status).toBe(401)
    expect((await makeLink(customer.user.id, customer.cookie)).status).toBe(403)
  })

  it('is not possible for the owner account or an unknown id', async () => {
    expect((await makeLink(owner.user.id)).status).toBe(404)
    expect((await makeLink('00000000-0000-4000-8000-000000000000')).status).toBe(404)
    expect((await makeLink('not-a-uuid')).status).toBe(400)
  })
})

describe('customer uses the link', () => {
  it('checks the link and greets the customer by first name', async () => {
    const { token } = (await makeLink()).body
    const res = await check(token)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ name: 'Nimali' })
  })

  it('sets the new password, signs them in and signs out their other devices', async () => {
    const { token } = (await makeLink()).body
    const res = await reset(token)
    expect(res.status).toBe(200)
    expect(res.body.email).toBe('nimali@example.com')
    expect(res.body.passwordHash).toBeUndefined()
    expect(String(res.headers['set-cookie'])).toContain('cp_session=')

    const user = await prisma.user.findUniqueOrThrow({ where: { id: customer.user.id } })
    expect(await bcrypt.compare('NewPassw0rd!', user.passwordHash)).toBe(true)
    expect(user.tokenVersion).toBe(customer.user.tokenVersion + 1)
    // the cookie from before the reset no longer works
    const me = await request(app).get('/api/auth/me').set('Cookie', customer.cookie)
    expect(me.body).toBeNull()

    const login = await request(app).post('/api/auth/login').set('Origin', ORIGIN).send({ email: 'nimali@example.com', password: 'NewPassw0rd!' })
    expect(login.status).toBe(200)
  })

  it('works only once', async () => {
    const { token } = (await makeLink()).body
    expect((await reset(token)).status).toBe(200)
    const again = await reset(token, 'AnotherPassw0rd!')
    expect(again.status).toBe(422)
    expect(again.body.error.message).toMatch(/expired or has already been used/)
    expect((await check(token)).status).toBe(422)
  })

  it('changes the password only once when the link is pressed twice at the same moment', async () => {
    const { token } = (await makeLink()).body
    const results = await Promise.all([reset(token, 'FirstPassw0rd!'), reset(token, 'SecondPassw0rd!')])
    expect(results.map((r) => r.status).sort()).toEqual([200, 422])
  })

  it('refuses an expired link', async () => {
    const { token } = (await makeLink()).body
    await prisma.passwordReset.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } })
    expect((await check(token)).status).toBe(422)
    expect((await reset(token)).status).toBe(422)
    const user = await prisma.user.findUniqueOrThrow({ where: { id: customer.user.id } })
    expect(user.passwordHash).toBe('not-a-real-hash')
  })

  it('refuses a made-up or cut-off link, and a weak password', async () => {
    expect((await check('A'.repeat(43))).status).toBe(422)
    expect((await check('short')).status).toBe(400)
    const { token } = (await makeLink()).body
    const weak = await reset(token, 'short')
    expect(weak.status).toBe(400)
    // a refused password does not use up the link
    expect((await check(token)).status).toBe(200)
  })

  it('needs the request to come from the shop website', async () => {
    const { token } = (await makeLink()).body
    const res = await request(app).post('/api/auth/password-reset').set('Origin', 'https://evil.example.com').send({ token, password: 'NewPassw0rd!' })
    expect(res.status).toBe(403)
  })
})

describe('clean-up', () => {
  it('removes used and expired links but keeps live ones', async () => {
    const used = (await makeLink()).body.token
    await reset(used)
    const other = await makeUser('CUSTOMER')
    await makeLink(other.user.id)
    const third = await makeUser('CUSTOMER')
    await makeLink(third.user.id)
    await prisma.passwordReset.updateMany({ where: { userId: third.user.id }, data: { expiresAt: new Date(Date.now() - 1000) } })

    expect(await deleteOldPasswordResets()).toBe(2)
    const left = await prisma.passwordReset.findMany()
    expect(left.map((r) => r.userId)).toEqual([other.user.id])
  })

  it('goes away with the customer account', async () => {
    await makeLink()
    await prisma.user.delete({ where: { id: customer.user.id } })
    expect(await prisma.passwordReset.count()).toBe(0)
  })
})
