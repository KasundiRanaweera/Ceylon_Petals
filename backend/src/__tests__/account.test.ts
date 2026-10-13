import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import bcrypt from 'bcryptjs'

// In-memory users and addresses, so the real service logic (transactions, defaults, ownership)
// runs for real.
interface UserRow {
  id: string
  name: string
  email: string
  phone: string
  passwordHash: string
  role: 'CUSTOMER' | 'OWNER'
  tokenVersion: number
  createdAt: Date
}
interface AddressRow {
  id: string
  userId: string
  label: string
  recipientName: string
  phone: string
  line1: string
  city: string
  district: string
  isDefault: boolean
  createdAt: Date
}
let users: UserRow[] = []
let addresses: AddressRow[] = []
let clock = 0

type Where = Partial<Pick<AddressRow, 'id' | 'userId' | 'isDefault'>>
const match = (a: AddressRow, w: Where = {}) => Object.entries(w).every(([k, v]) => a[k as keyof Where] === v)

const addressModel = {
  findMany: async ({ where }: { where: Where }) =>
    addresses
      .filter((a) => match(a, where))
      .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || b.createdAt.getTime() - a.createdAt.getTime()),
  findFirst: async ({ where, orderBy }: { where: Where; orderBy?: unknown }) => {
    const list = addresses.filter((a) => match(a, where))
    if (orderBy) list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    return list[0] ?? null
  },
  count: async ({ where }: { where: Where }) => addresses.filter((a) => match(a, where)).length,
  create: async ({ data }: { data: Omit<AddressRow, 'id' | 'createdAt'> }) => {
    const row = { ...data, id: randomUUID(), createdAt: new Date(2026, 9, 1, 0, 0, ++clock) }
    addresses.push(row)
    return row
  },
  update: async ({ where, data }: { where: { id: string }; data: Partial<AddressRow> }) => {
    const row = addresses.find((a) => a.id === where.id)!
    Object.assign(row, data)
    return row
  },
  updateMany: async ({ where, data }: { where: Where; data: Partial<AddressRow> }) => {
    addresses.filter((a) => match(a, where)).forEach((a) => Object.assign(a, data))
  },
  delete: async ({ where }: { where: { id: string } }) => {
    addresses = addresses.filter((a) => a.id !== where.id)
  },
}

const prismaMock = {
  user: {
    findUnique: async ({ where }: { where: { email?: string; id?: string } }) =>
      users.find((u) => (where.email ? u.email === where.email : u.id === where.id)) ?? null,
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const row = { id: `user-${users.length + 1}`, tokenVersion: 0, createdAt: new Date(), ...data } as UserRow
      users.push(row)
      return row
    },
    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const row = users.find((u) => u.id === where.id)!
      const { tokenVersion, ...rest } = data as { tokenVersion?: { increment: number } } & Partial<UserRow>
      Object.assign(row, rest)
      if (tokenVersion) row.tokenVersion += tokenVersion.increment
      return row
    },
  },
  address: addressModel,
  $transaction: async <T>(fn: (tx: unknown) => Promise<T>) => fn(prismaMock),
}
vi.mock('../lib/prisma.js', () => ({ prisma: prismaMock }))

const { createApp } = await import('../app.js')
const { signAuthToken } = await import('../lib/tokens.js')

const ORIGIN = 'http://localhost:5173'
const app = createApp()
const send = (method: 'post' | 'put' | 'patch' | 'delete' | 'get', path: string, cookie?: string) => {
  const req = request(app)[method](path).set('Origin', ORIGIN)
  return cookie ? req.set('Cookie', cookie) : req
}
const cookieFrom = (res: request.Response) => (res.headers['set-cookie'] as unknown as string[] | undefined)?.[0]?.split(';')[0] ?? ''

// Creates the user directly (not through /register, which is rate limited to 10 per hour)
// and returns a login cookie, exactly like a signed-in browser would have.
async function signUp(email: string, password = 'sunflower99') {
  const row: UserRow = {
    id: randomUUID(),
    name: 'Test User',
    email,
    phone: '94771234567',
    passwordHash: await bcrypt.hash(password, 4),
    role: 'CUSTOMER',
    tokenVersion: 0,
    createdAt: new Date(),
  }
  users.push(row)
  return { cookie: `cp_session=${signAuthToken(row)}`, id: row.id }
}

const sampleAddress = {
  label: 'Home',
  recipientName: 'Amaya Fernando',
  phone: '077 123 4567',
  line1: '18/2 Ward Place',
  city: 'Colombo 07',
  district: 'Colombo',
}

beforeEach(() => {
  users = []
  addresses = []
  clock = 0
})

describe('access', () => {
  it('needs a signed-in user for every account route', async () => {
    for (const [method, path] of [
      ['patch', '/api/me'],
      ['post', '/api/me/password'],
      ['get', '/api/me/addresses'],
      ['post', '/api/me/addresses'],
      ['put', '/api/me/addresses/11111111-1111-4111-8111-111111111111'],
      ['delete', '/api/me/addresses/11111111-1111-4111-8111-111111111111'],
    ] as const) {
      expect((await send(method, path)).status, `${method} ${path}`).toBe(401)
    }
  })
})

describe('profile', () => {
  it('updates name and phone (and normalises the phone)', async () => {
    const { cookie } = await signUp('a@example.com')
    const res = await send('patch', '/api/me', cookie).send({ name: '  Amaya F.  ', phone: '+94 71 555 6666' })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ name: 'Amaya F.', phone: '94715556666', email: 'a@example.com' })
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash/)
  })

  it('cannot change email or role through this endpoint', async () => {
    const { cookie } = await signUp('a@example.com')
    await send('patch', '/api/me', cookie).send({ name: 'X Y', phone: '0771234567', email: 'hijack@example.com', role: 'OWNER' })
    expect(users[0]).toMatchObject({ email: 'a@example.com', role: 'CUSTOMER' })
  })

  it('validates input', async () => {
    const { cookie } = await signUp('a@example.com')
    const res = await send('patch', '/api/me', cookie).send({ name: '', phone: '12' })
    expect(res.status).toBe(400)
  })
})

describe('change password', () => {
  it('needs the right current password', async () => {
    const { cookie } = await signUp('a@example.com')
    const res = await send('post', '/api/me/password', cookie).send({ currentPassword: 'not-it-at-all', newPassword: 'brand-new-pass1' })
    expect(res.status).toBe(422)
    expect(res.body.error.message).toMatch(/current password is not correct/i)
  })

  it('enforces the password rules and rejects an unchanged password', async () => {
    const { cookie } = await signUp('a@example.com')
    expect((await send('post', '/api/me/password', cookie).send({ currentPassword: 'sunflower99', newPassword: 'short' })).status).toBe(400)
    expect((await send('post', '/api/me/password', cookie).send({ currentPassword: 'sunflower99', newPassword: 'sunflower99' })).status).toBe(400)
  })

  it('changes the password, keeps this device signed in and signs out other devices', async () => {
    const { cookie: thisDevice } = await signUp('a@example.com')
    const otherDevice = cookieFrom(await send('post', '/api/auth/login').send({ email: 'a@example.com', password: 'sunflower99' }))

    const res = await send('post', '/api/me/password', thisDevice).send({ currentPassword: 'sunflower99', newPassword: 'brand-new-pass1' })
    expect(res.status).toBe(200)
    const refreshed = cookieFrom(res)
    expect(refreshed).toMatch(/^cp_session=/)

    expect(await bcrypt.compare('brand-new-pass1', users[0]!.passwordHash)).toBe(true)
    expect((await send('get', '/api/auth/me', refreshed)).body?.email).toBe('a@example.com') // this device: still in
    expect((await send('get', '/api/auth/me', otherDevice)).body).toBeNull() // other device: out
    expect((await send('get', '/api/auth/me', thisDevice)).body).toBeNull() // the old token: out

    // Old password no longer works, new one does.
    expect((await send('post', '/api/auth/login').send({ email: 'a@example.com', password: 'sunflower99' })).status).toBe(401)
    expect((await send('post', '/api/auth/login').send({ email: 'a@example.com', password: 'brand-new-pass1' })).status).toBe(200)
  })

  it('limits wrong current-password guesses (429 after 5)', async () => {
    const { cookie } = await signUp('guess@example.com')
    const codes: number[] = []
    for (let i = 0; i < 7; i++) {
      codes.push((await send('post', '/api/me/password', cookie).send({ currentPassword: `wrong-${i}`, newPassword: 'brand-new-pass1' })).status)
    }
    expect(codes).toEqual([422, 422, 422, 422, 422, 429, 429])
  })
})

describe('addresses', () => {
  it('makes the first address the default and returns the frontend shape', async () => {
    const { cookie, id } = await signUp('a@example.com')
    const res = await send('post', '/api/me/addresses', cookie).send(sampleAddress)
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ userId: id, label: 'Home', phone: '94771234567', district: 'Colombo', isDefault: true })
    expect(Object.keys(res.body).sort()).toEqual(['city', 'district', 'id', 'isDefault', 'label', 'line1', 'phone', 'recipientName', 'userId'])
  })

  it('keeps only one default and lists it first', async () => {
    const { cookie } = await signUp('a@example.com')
    await send('post', '/api/me/addresses', cookie).send(sampleAddress)
    const second = await send('post', '/api/me/addresses', cookie).send({ ...sampleAddress, label: 'Amma', city: 'Kandy', district: 'Kandy' })
    expect(second.body.isDefault).toBe(false)

    const made = await send('put', `/api/me/addresses/${second.body.id}`, cookie).send({ ...sampleAddress, label: 'Amma', city: 'Kandy', district: 'Kandy', isDefault: true })
    expect(made.body.isDefault).toBe(true)

    const list = await send('get', '/api/me/addresses', cookie)
    expect(list.body.map((a: { label: string }) => a.label)).toEqual(['Amma', 'Home'])
    expect(list.body.filter((a: { isDefault: boolean }) => a.isDefault)).toHaveLength(1)
  })

  it('promotes another address when the default is deleted', async () => {
    const { cookie } = await signUp('a@example.com')
    const first = await send('post', '/api/me/addresses', cookie).send(sampleAddress)
    await send('post', '/api/me/addresses', cookie).send({ ...sampleAddress, label: 'Office' })
    expect((await send('delete', `/api/me/addresses/${first.body.id}`, cookie)).status).toBe(204)
    const list = await send('get', '/api/me/addresses', cookie)
    expect(list.body).toHaveLength(1)
    expect(list.body[0]).toMatchObject({ label: 'Office', isDefault: true })
  })

  it("never shows or changes another customer's addresses (404)", async () => {
    const alice = await signUp('alice@example.com')
    const bob = await signUp('bob@example.com')
    const aliceAddress = await send('post', '/api/me/addresses', alice.cookie).send(sampleAddress)

    expect((await send('get', '/api/me/addresses', bob.cookie)).body).toEqual([])
    expect((await send('put', `/api/me/addresses/${aliceAddress.body.id}`, bob.cookie).send(sampleAddress)).status).toBe(404)
    expect((await send('delete', `/api/me/addresses/${aliceAddress.body.id}`, bob.cookie)).status).toBe(404)
    expect(addresses).toHaveLength(1)
  })

  it('validates district, phone and required fields', async () => {
    const { cookie } = await signUp('a@example.com')
    const res = await send('post', '/api/me/addresses', cookie).send({ ...sampleAddress, district: 'Atlantis', phone: '1', line1: ' ' })
    expect(res.status).toBe(400)
    const fields = res.body.error.details.map((d: { field: string }) => d.field)
    expect(fields).toEqual(expect.arrayContaining(['district', 'phone', 'line1']))
    expect(addresses).toHaveLength(0)
  })

  it('defaults an empty label to "Address" and stops at 10 saved addresses', async () => {
    const { cookie } = await signUp('a@example.com')
    const noLabel = await send('post', '/api/me/addresses', cookie).send({ ...sampleAddress, label: '  ' })
    expect(noLabel.body.label).toBe('Address')
    for (let i = 0; i < 9; i++) await send('post', '/api/me/addresses', cookie).send(sampleAddress)
    const eleventh = await send('post', '/api/me/addresses', cookie).send(sampleAddress)
    expect(eleventh.status).toBe(422)
  })
})
