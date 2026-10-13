import { beforeEach, describe, expect, it, vi } from 'vitest'
import express from 'express'
import cookieParser from 'cookie-parser'
import request from 'supertest'
import jwt from 'jsonwebtoken'

// A tiny in-memory "users table", so the real hashing, token and cookie code runs for real.
interface Row {
  id: string
  name: string
  email: string
  phone: string
  passwordHash: string
  role: 'CUSTOMER' | 'OWNER'
  tokenVersion: number
  createdAt: Date
}
let users: Row[] = []
const created: Record<string, unknown>[] = []

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: async ({ where }: { where: { email?: string; id?: string } }) =>
        users.find((u) => (where.email ? u.email === where.email : u.id === where.id)) ?? null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        created.push(data)
        const row = { id: `user-${users.length + 1}`, tokenVersion: 0, createdAt: new Date('2026-10-12T00:00:00Z'), ...data } as Row
        users.push(row)
        return row
      },
      update: async ({ where, data }: { where: { id: string }; data: { tokenVersion?: { increment: number } } }) => {
        const row = users.find((u) => u.id === where.id)!
        if (data.tokenVersion) row.tokenVersion += data.tokenVersion.increment
        return row
      },
    },
  },
}))

const { createApp } = await import('../app.js')
const { authenticate, requireAuth, requireOwner } = await import('../middleware/auth.js')
const { errorHandler } = await import('../middleware/errorHandler.js')
const { signAuthToken, verifyAuthToken } = await import('../lib/tokens.js')
const bcrypt = (await import('bcryptjs')).default

const ORIGIN = 'http://localhost:5173'
const valid = { name: 'Amaya Fernando', email: 'Amaya@Example.com', phone: '077 123 4567', password: 'sunflower99' }

const app = createApp()
const post = (path: string) => request(app).post(path).set('Origin', ORIGIN)
const cookieFrom = (res: request.Response) => (res.headers['set-cookie'] as unknown as string[] | undefined)?.[0]?.split(';')[0] ?? ''

beforeEach(() => {
  users = []
  created.length = 0
})

describe('register', () => {
  it('creates a customer, hashes the password and logs them in', async () => {
    const res = await post('/api/auth/register').send(valid)
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ name: 'Amaya Fernando', email: 'amaya@example.com', phone: '94771234567', role: 'CUSTOMER' })
    expect(JSON.stringify(res.body)).not.toMatch(/password|hash|tokenVersion/i)

    const stored = users[0]!
    expect(stored.passwordHash).not.toContain('sunflower99')
    expect(await bcrypt.compare('sunflower99', stored.passwordHash)).toBe(true)

    const setCookie = (res.headers['set-cookie'] as unknown as string[])[0]!
    expect(setCookie).toMatch(/^cp_session=/)
    expect(setCookie).toMatch(/HttpOnly/i)
    expect(setCookie).toMatch(/SameSite=Lax/i)
    expect(setCookie).toMatch(/Path=\//)
  })

  it('can never create an owner, even if the request asks for it', async () => {
    const res = await post('/api/auth/register').send({ ...valid, role: 'OWNER', isAdmin: true })
    expect(res.status).toBe(201)
    expect(res.body.role).toBe('CUSTOMER')
    expect(created[0]!.role).toBe('CUSTOMER')
    expect(created[0]).not.toHaveProperty('isAdmin')
  })

  it('rejects an email that is already registered', async () => {
    await post('/api/auth/register').send(valid)
    const again = await post('/api/auth/register').send({ ...valid, email: ' AMAYA@example.com ' })
    expect(again.status).toBe(409)
    expect(again.body.error.code).toBe('CONFLICT')
  })

  it('validates the fields', async () => {
    const res = await post('/api/auth/register').send({ name: '', email: 'nope', phone: '12', password: 'short' })
    expect(res.status).toBe(400)
    const fields = res.body.error.details.map((d: { field: string }) => d.field)
    expect(fields).toEqual(expect.arrayContaining(['name', 'email', 'phone', 'password']))
  })
})

describe('login', () => {
  beforeEach(async () => {
    await post('/api/auth/register').send(valid)
  })

  it('signs in with the right password (email is not case sensitive)', async () => {
    const res = await post('/api/auth/login').send({ email: 'AMAYA@example.COM', password: 'sunflower99' })
    expect(res.status).toBe(200)
    expect(res.body.email).toBe('amaya@example.com')
    expect(cookieFrom(res)).toMatch(/^cp_session=.+/)
  })

  it('gives the same answer for a wrong password and an unknown email', async () => {
    const wrongPassword = await post('/api/auth/login').send({ email: 'amaya@example.com', password: 'wrong-password' })
    const unknownEmail = await post('/api/auth/login').send({ email: 'nobody@example.com', password: 'sunflower99' })
    expect(wrongPassword.status).toBe(401)
    expect(unknownEmail.status).toBe(401)
    expect(wrongPassword.body).toEqual(unknownEmail.body)
    expect(wrongPassword.headers['set-cookie']).toBeUndefined()
  })

  it('locks out repeated wrong passwords for the same email (429)', async () => {
    const email = 'brute.force@example.com'
    const statuses: number[] = []
    for (let i = 0; i < 12; i++) {
      statuses.push((await post('/api/auth/login').send({ email, password: `guess-${i}` })).status)
    }
    expect(statuses.slice(0, 10).every((s) => s === 401)).toBe(true)
    expect(statuses.slice(10)).toEqual([429, 429])
    // Another email from the same address is not affected.
    const other = await post('/api/auth/login').send({ email: 'amaya@example.com', password: 'sunflower99' })
    expect(other.status).toBe(200)
  })
})

describe('session', () => {
  it('/me is null for guests', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(200)
    expect(res.body).toBeNull()
  })

  it('/me returns the user for a valid cookie', async () => {
    const register = await post('/api/auth/register').send(valid)
    const res = await request(app).get('/api/auth/me').set('Cookie', cookieFrom(register))
    expect(res.status).toBe(200)
    expect(res.body.email).toBe('amaya@example.com')
  })

  it('ignores and clears a forged or garbage cookie', async () => {
    const forged = jwt.sign({ tv: 0 }, 'some-other-secret-that-is-long-enough-123456', { subject: 'user-1' })
    for (const value of ['garbage', forged]) {
      const res = await request(app).get('/api/auth/me').set('Cookie', `cp_session=${value}`)
      expect(res.body).toBeNull()
      expect(String(res.headers['set-cookie'])).toMatch(/cp_session=;/)
    }
  })

  it('rejects tokens that use the "none" algorithm', () => {
    const none = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${Buffer.from('{"sub":"user-1","tv":0}').toString('base64url')}.`
    expect(verifyAuthToken(none)).toBeNull()
  })

  it('logout clears the cookie', async () => {
    const res = await post('/api/auth/logout')
    expect(res.status).toBe(204)
    expect(String(res.headers['set-cookie'])).toMatch(/cp_session=;/)
  })

  it('logout-all needs a sign-in, then revokes every existing token', async () => {
    expect((await post('/api/auth/logout-all')).status).toBe(401)

    const register = await post('/api/auth/register').send(valid)
    const cookie = cookieFrom(register)
    const out = await post('/api/auth/logout-all').set('Cookie', cookie)
    expect(out.status).toBe(204)
    expect(users[0]!.tokenVersion).toBe(1)

    // The old cookie no longer works.
    const me = await request(app).get('/api/auth/me').set('Cookie', cookie)
    expect(me.body).toBeNull()
  })

  it('a removed user no longer counts as signed in', async () => {
    const register = await post('/api/auth/register').send(valid)
    users = []
    const me = await request(app).get('/api/auth/me').set('Cookie', cookieFrom(register))
    expect(me.body).toBeNull()
  })
})

describe('cross-site request protection', () => {
  it('blocks state-changing requests from other websites', async () => {
    const evil = await request(app).post('/api/auth/logout').set('Origin', 'https://evil.example')
    expect(evil.status).toBe(403)
    const ok = await request(app).post('/api/auth/logout').set('Origin', ORIGIN)
    expect(ok.status).toBe(204)
  })

  it('allows requests with no Origin (server-to-server) and reads from anywhere', async () => {
    expect((await request(app).post('/api/auth/logout')).status).toBe(204)
    expect((await request(app).get('/api/auth/me').set('Origin', 'https://evil.example')).status).toBe(200)
  })
})

describe('role guards', () => {
  const guarded = express()
  guarded.use(cookieParser())
  guarded.use(authenticate)
  guarded.get('/any-user', requireAuth, (_req, res) => void res.json({ ok: true }))
  guarded.get('/owner-only', requireOwner, (_req, res) => void res.json({ ok: true }))
  guarded.use(errorHandler)

  const tokenFor = (role: 'CUSTOMER' | 'OWNER') => {
    const row: Row = {
      id: `${role}-1`, name: 'T', email: `${role}@example.com`, phone: '94771234567',
      passwordHash: 'x', role, tokenVersion: 0, createdAt: new Date(),
    }
    users.push(row)
    return `cp_session=${signAuthToken(row)}`
  }

  it('guests get 401', async () => {
    expect((await request(guarded).get('/any-user')).status).toBe(401)
    expect((await request(guarded).get('/owner-only')).status).toBe(401)
  })

  it('customers can use signed-in routes but not owner routes (403)', async () => {
    const cookie = tokenFor('CUSTOMER')
    expect((await request(guarded).get('/any-user').set('Cookie', cookie)).status).toBe(200)
    expect((await request(guarded).get('/owner-only').set('Cookie', cookie)).status).toBe(403)
  })

  it('the owner can reach owner routes', async () => {
    expect((await request(guarded).get('/owner-only').set('Cookie', tokenFor('OWNER'))).status).toBe(200)
  })

  it('a demoted owner loses access immediately (role is read from the database)', async () => {
    const cookie = tokenFor('OWNER')
    users.find((u) => u.role === 'OWNER')!.role = 'CUSTOMER'
    expect((await request(guarded).get('/owner-only').set('Cookie', cookie)).status).toBe(403)
  })
})
