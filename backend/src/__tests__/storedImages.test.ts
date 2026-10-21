import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

vi.mock('../lib/prisma.js', async () => ({ prisma: (await import('./helpers/testDb.js')).prisma }))

const { prisma, resetDb, makeUser } = await import('./helpers/testDb.js')
const { createApp } = await import('../app.js')
const { detectImageType, deleteUnusedStoredImages } = await import('../services/storedImages.js')

const ORIGIN = 'http://localhost:5173'
const app = createApp()
let owner: { cookie: string }

// The first bytes of each format are enough for the type check; the rest is filler.
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(40, 1)])
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(40, 2)])
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.from([0, 0, 0, 0]), Buffer.from('WEBPVP8 '), Buffer.alloc(40, 3)])

const upload = (bytes: Buffer, type = 'image/png', cookie = owner.cookie) =>
  request(app).post('/api/admin/uploads').set('Origin', ORIGIN).set('Cookie', cookie).set('Content-Type', type).send(bytes)

beforeEach(async () => {
  await resetDb()
  owner = await makeUser('OWNER')
})

describe('photo uploads without Cloudinary', () => {
  it('says which upload mode is in use', async () => {
    const res = await request(app).get('/api/admin/uploads/mode').set('Cookie', owner.cookie)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ mode: 'shop' })
  })

  it('stores a photo and serves it back with its type and a long cache', async () => {
    const res = await upload(PNG)
    expect(res.status).toBe(201)
    expect(res.body.url).toMatch(/^\/api\/images\/[0-9a-f-]{36}$/)

    const img = await request(app).get(res.body.url)
    expect(img.status).toBe(200)
    expect(img.headers['content-type']).toBe('image/png')
    expect(img.headers['cache-control']).toContain('immutable')
    expect(Buffer.from(img.body).equals(PNG)).toBe(true)
  })

  it('takes the type from the bytes, not from what the browser claims', async () => {
    const res = await upload(JPEG, 'image/webp')
    const img = await request(app).get(res.body.url)
    expect(img.headers['content-type']).toBe('image/jpeg')
  })

  it('refuses things that are not photos', async () => {
    expect((await upload(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'), 'image/png')).status).toBe(400)
    expect((await upload(Buffer.from('plain text here, not an image at all'), 'image/jpeg')).status).toBe(400)
    // a type the route does not accept never reaches it as bytes
    expect((await upload(PNG, 'text/html')).status).toBe(400)
  })

  it('refuses photos over 5 MB', async () => {
    const big = Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024 + 1)])
    expect((await upload(big)).status).toBe(413)
  })

  it('is closed to guests and customers', async () => {
    const customer = await makeUser('CUSTOMER')
    expect((await request(app).post('/api/admin/uploads').set('Origin', ORIGIN).set('Content-Type', 'image/png').send(PNG)).status).toBe(401)
    expect((await upload(PNG, 'image/png', customer.cookie)).status).toBe(403)
  })

  it('returns 404 for a missing photo and 400 for a bad id', async () => {
    expect((await request(app).get('/api/images/3f1c1b8e-9a51-4f2a-8f37-0d8a8e2b0a11')).status).toBe(404)
    expect((await request(app).get('/api/images/not-a-uuid')).status).toBe(400)
  })

  it('lets a product use an uploaded photo', async () => {
    const { body } = await upload(WEBP, 'image/webp')
    const category = await prisma.category.create({ data: { slug: 'roses', name: 'Roses' } })
    const res = await request(app)
      .post('/api/admin/products')
      .set('Origin', ORIGIN)
      .set('Cookie', owner.cookie)
      .send({ name: 'Uploaded Photo Rose', categoryId: category.slug, shortDescription: 'A rose', description: '', price: 5000, stock: 3, images: [body.url] })
    expect(res.status).toBe(201)
    expect(res.body.images).toEqual([body.url])
  })
})

describe('cleaning up unused photos', () => {
  it('removes old uploads nothing uses, and keeps new ones and used ones', async () => {
    const old = new Date(Date.now() - 48 * 3600_000)
    const unused = await prisma.storedImage.create({ data: { mime: 'image/png', data: new Uint8Array(PNG), size: PNG.length, createdAt: old } })
    const used = await prisma.storedImage.create({ data: { mime: 'image/png', data: new Uint8Array(PNG), size: PNG.length, createdAt: old } })
    const fresh = await prisma.storedImage.create({ data: { mime: 'image/png', data: new Uint8Array(PNG), size: PNG.length } })
    await prisma.category.create({ data: { slug: 'lilies', name: 'Lilies', imageUrl: `/api/images/${used.id}` } })

    expect(await deleteUnusedStoredImages()).toBe(1)
    const left = (await prisma.storedImage.findMany({ select: { id: true } })).map((r) => r.id).sort()
    expect(left).toEqual([used.id, fresh.id].sort())
    expect(left).not.toContain(unused.id)
  })
})

describe('detectImageType', () => {
  it('recognises the photo formats by their first bytes', () => {
    expect(detectImageType(PNG)).toBe('image/png')
    expect(detectImageType(JPEG)).toBe('image/jpeg')
    expect(detectImageType(WEBP)).toBe('image/webp')
    expect(detectImageType(Buffer.concat([Buffer.from([0, 0, 0, 0x20]), Buffer.from('ftypavif'), Buffer.alloc(8)]))).toBe('image/avif')
    expect(detectImageType(Buffer.from('GIF89a........'))).toBeNull()
  })
})
