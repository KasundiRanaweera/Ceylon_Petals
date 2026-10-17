import { createHash } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

vi.mock('../lib/prisma.js', async () => ({ prisma: (await import('./helpers/testDb.js')).prisma }))

const { prisma, resetDb, seedShop, makeProduct, makeCategory, makeOrder, makeUser } = await import('./helpers/testDb.js')
const { createApp } = await import('../app.js')
const { env } = await import('../config/env.js')
const { signParams, publicIdFromUrl, deleteCloudinaryImage } = await import('../lib/cloudinary.js')

const ORIGIN = 'http://localhost:5173'
const app = createApp()
let owner: { cookie: string }

const admin = (method: 'get' | 'post' | 'put' | 'patch' | 'delete', path: string) => request(app)[method](`/api/admin${path}`).set('Origin', ORIGIN).set('Cookie', owner.cookie)
const publicGet = (path: string) => request(app).get(`/api${path}`)

const validProduct = (over: Record<string, unknown> = {}) => ({
  name: 'Red Rose Bouquet', categoryId: 'roses', shortDescription: 'A dozen red roses', description: 'Long text',
  price: 9500, stock: 4, lowStockThreshold: 2, isFeatured: false, isActive: true, sameDay: true,
  occasions: ['love', 'birthday'], images: ['https://img.example/a.jpg', 'https://img.example/b.jpg'],
  details: ['12 roses'], flowerTypes: ['Roses'], colours: ['Red'], tags: [], ...over,
})

beforeEach(async () => {
  await resetDb()
  await seedShop()
  await makeCategory('roses')
  owner = await makeUser('OWNER')
})
afterEach(() => vi.restoreAllMocks())

describe('creating products', () => {
  it('creates a product and returns it in the shape the frontend uses', async () => {
    const res = await admin('post', '/products').send(validProduct())
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      name: 'Red Rose Bouquet', slug: 'red-rose-bouquet', categoryId: 'roses', price: 9500, stock: 4, isActive: true,
      occasions: expect.arrayContaining(['love', 'birthday']), images: ['https://img.example/a.jpg', 'https://img.example/b.jpg'],
    })
    expect(res.body.id).toMatch(/^[0-9a-f-]{36}$/)
    expect('discountPrice' in res.body).toBe(false)
  })

  it('makes unique web addresses from the name', async () => {
    const first = await admin('post', '/products').send(validProduct())
    const second = await admin('post', '/products').send(validProduct())
    const third = await admin('post', '/products').send(validProduct({ name: 'Lilies & Orchids!' }))
    expect([first.body.slug, second.body.slug, third.body.slug]).toEqual(['red-rose-bouquet', 'red-rose-bouquet-2', 'lilies-and-orchids'])
  })

  it('keeps the photo order, and uses the short description when there is no long one', async () => {
    const res = await admin('post', '/products').send(validProduct({ description: '', images: ['https://i/3.jpg', 'https://i/1.jpg', 'https://i/2.jpg'] }))
    expect(res.body.images).toEqual(['https://i/3.jpg', 'https://i/1.jpg', 'https://i/2.jpg'])
    expect(res.body.description).toBe('A dozen red roses')
  })

  it('appears in the shop straight away, and hidden products do not', async () => {
    await admin('post', '/products').send(validProduct())
    await admin('post', '/products').send(validProduct({ name: 'Secret Bouquet', isActive: false }))
    const shop = await publicGet('/products')
    expect(shop.body.map((p: { slug: string }) => p.slug)).toEqual(['red-rose-bouquet'])
    expect((await admin('get', '/products')).body).toHaveLength(2) // the owner sees both
    expect((await publicGet('/products/secret-bouquet')).status).toBe(404)
  })

  describe('rules', () => {
    const bad = async (over: Record<string, unknown>) => admin('post', '/products').send(validProduct(over))

    it('rejects missing or silly values with a clear field name', async () => {
      for (const [over, field] of [
        [{ name: '' }, 'name'], [{ price: 0 }, 'price'], [{ price: 99.5 }, 'price'], [{ price: 'free' }, 'price'],
        [{ stock: -1 }, 'stock'], [{ images: [] }, 'images'], [{ shortDescription: '' }, 'shortDescription'],
      ] as const) {
        const res = await bad(over)
        expect(res.status, JSON.stringify(over)).toBe(400)
        expect(res.body.error.details.some((d: { field: string }) => d.field.startsWith(field)), field).toBe(true)
      }
    })

    it("only accepts https photo links or the shop's own /images/ files (no data: images, no plain http)", async () => {
      expect((await bad({ images: ['data:image/png;base64,AAAA'] })).status).toBe(400)
      expect((await bad({ images: ['http://img.example/a.jpg'] })).status).toBe(400)
      expect((await bad({ images: ['javascript:alert(1)'] })).status).toBe(400)
      expect((await bad({ images: ['/etc/passwd'] })).status).toBe(400)
      expect((await bad({ images: ['/images/../secret.webp'] })).status).toBe(400)
      expect((await bad({ images: ['//evil.example/x.jpg'] })).status).toBe(400)
      expect((await bad({ images: ['/images/products/ok.webp'] })).status).toBe(201)
      expect((await bad({ images: Array.from({ length: 11 }, (_, i) => `https://i/${i}.jpg`) })).status).toBe(400)
    })

    it('a price that is far too high gets a clear message, not "Please enter a number"', async () => {
      const res = await bad({ price: 2202702203200 })
      expect(res.status).toBe(400)
      expect(res.body.error.details[0].message).toMatch(/too high/)
    })

  it('the sale price must be below the regular price', async () => {
      const res = await bad({ discountPrice: 9500 })
      expect(res.status).toBe(422)
      expect(res.body.error.message).toBe('The sale price must be lower than the regular price.')
      expect((await bad({ discountPrice: 8000 })).body.discountPrice).toBe(8000)
    })

    it('needs a category and occasions that exist', async () => {
      expect((await bad({ categoryId: 'nope' })).body.error.message).toBe('Please choose a category.')
      expect((await bad({ occasions: ['love', 'moon-landing'] })).status).toBe(422)
    })

    it('needs the owner (guests and customers are refused)', async () => {
      const customer = await makeUser('CUSTOMER')
      expect((await request(app).post('/api/admin/products').set('Origin', ORIGIN).send(validProduct())).status).toBe(401)
      expect((await request(app).post('/api/admin/products').set('Origin', ORIGIN).set('Cookie', customer.cookie).send(validProduct())).status).toBe(403)
      expect(await prisma.product.count()).toBe(0)
    })
  })
})

describe('editing products', () => {
  it('replaces the details, photos (in order) and occasions, but never the web address', async () => {
    const created = (await admin('post', '/products').send(validProduct())).body
    const res = await admin('put', `/products/${created.id}`).send(
      validProduct({ name: 'Renamed Bouquet', slug: 'hacked-slug', price: 12000, discountPrice: 11000, occasions: ['sympathy'], images: ['https://i/new2.jpg', 'https://i/new1.jpg'], badge: 'New', isFeatured: true })
    )
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ id: created.id, name: 'Renamed Bouquet', slug: 'red-rose-bouquet', price: 12000, discountPrice: 11000, badge: 'New', isFeatured: true })
    expect(res.body.occasions).toEqual(['sympathy'])
    expect(res.body.images).toEqual(['https://i/new2.jpg', 'https://i/new1.jpg'])
    expect(await prisma.productImage.count()).toBe(2) // the old photos are gone, not piled up
  })

  it("can change the price of a product whose photos are the shop's own /images/ files", async () => {
    const own = ['/images/products/a-1280.webp', '/images/products/b-1280.webp']
    const created = (await admin('post', '/products').send(validProduct({ images: own }))).body
    const res = await admin('put', `/products/${created.id}`).send(validProduct({ images: own, price: 12500 }))
    expect(res.status).toBe(200)
    expect(res.body.price).toBe(12500)
    expect(res.body.images).toEqual(own)
  })

  it('can remove a sale price, a badge and plant facts again', async () => {
    const created = (await admin('post', '/products').send(validProduct({ discountPrice: 8000, badge: 'Sale', attributes: { Light: 'Bright' } }))).body
    expect(created.attributes).toEqual({ Light: 'Bright' })
    const res = await admin('put', `/products/${created.id}`).send(validProduct({ discountPrice: null, badge: null, attributes: null }))
    expect('discountPrice' in res.body).toBe(false)
    expect('badge' in res.body).toBe(false)
    expect('attributes' in res.body).toBe(false)
  })

  it('a failed edit changes nothing (the old photos stay)', async () => {
    const created = (await admin('post', '/products').send(validProduct())).body
    const res = await admin('put', `/products/${created.id}`).send(validProduct({ categoryId: 'does-not-exist', images: ['https://i/x.jpg'] }))
    expect(res.status).toBe(422)
    expect((await admin('get', `/products/${created.id}`)).body.images).toEqual(['https://img.example/a.jpg', 'https://img.example/b.jpg'])
  })

  it('unknown or malformed ids', async () => {
    expect((await admin('put', '/products/11111111-1111-4111-8111-111111111111').send(validProduct())).status).toBe(404)
    expect((await admin('put', '/products/not-a-uuid').send(validProduct())).status).toBe(400)
    expect((await admin('get', '/products/11111111-1111-4111-8111-111111111111')).status).toBe(404)
  })

  it('hides and shows a product in the shop', async () => {
    const { id, slug } = (await admin('post', '/products').send(validProduct())).body
    expect((await admin('patch', `/products/${id}/active`).send({ isActive: false })).body.isActive).toBe(false)
    expect((await publicGet(`/products/${slug}`)).status).toBe(404)
    await admin('patch', `/products/${id}/active`).send({ isActive: true })
    expect((await publicGet(`/products/${slug}`)).status).toBe(200)
    expect((await admin('patch', `/products/${id}/active`).send({ isActive: 'yes' })).status).toBe(400)
  })

  it('updates stock, and refuses nonsense', async () => {
    const { id, slug } = (await admin('post', '/products').send(validProduct())).body
    expect((await admin('patch', `/products/${id}/stock`).send({ stock: 0 })).body.stock).toBe(0)
    expect((await publicGet(`/products/${slug}`)).body.stock).toBe(0)
    for (const stock of [-1, 1.5, '5', null, 1_000_000]) {
      expect((await admin('patch', `/products/${id}/stock`).send({ stock })).status, String(stock)).toBe(400)
    }
    expect((await admin('patch', '/products/11111111-1111-4111-8111-111111111111/stock').send({ stock: 3 })).status).toBe(404)
  })
})

describe('deleting products', () => {
  it('removes the product but keeps past orders readable', async () => {
    const { id } = (await admin('post', '/products').send(validProduct())).body
    await makeOrder({ items: [{ productId: id, name: 'Red Rose Bouquet', unitPrice: 9500, quantity: 2 }] })

    expect((await admin('delete', `/products/${id}`)).status).toBe(204)
    expect(await prisma.product.count()).toBe(0)
    expect(await prisma.productImage.count()).toBe(0)

    const order = (await admin('get', '/orders/1050')).body
    expect(order.items[0]).toMatchObject({ name: 'Red Rose Bouquet', unitPrice: 9500, quantity: 2 })
    expect(order.items[0].productId).toBeUndefined()
    expect((await admin('delete', `/products/${id}`)).status).toBe(404)
  })
})

describe('categories', () => {
  it('lists every category with how many products it holds (hidden ones included)', async () => {
    await makeCategory('plants', { sortOrder: 2, isActive: false })
    await makeProduct({ slug: 'a', category: 'roses' })
    await makeProduct({ slug: 'b', category: 'roses', isActive: false })
    const res = await admin('get', '/categories')
    expect(res.body.map((c: { id: string; productCount: number; isActive: boolean }) => [c.id, c.productCount, c.isActive])).toEqual([['roses', 2, true], ['plants', 0, false]])
  })

  it('creates a category whose address comes from its name, and refuses a duplicate', async () => {
    const res = await admin('post', '/categories').send({ name: 'Sympathy & Tributes', description: 'Quiet flowers', imageUrl: '', sortOrder: 5, isActive: true })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ id: 'sympathy-and-tributes', slug: 'sympathy-and-tributes', productCount: 0 })
    expect((await admin('post', '/categories').send({ name: 'Sympathy & Tributes' })).status).toBe(409)
    expect((await admin('post', '/categories').send({ name: '   ' })).status).toBe(400)
    expect((await admin('post', '/categories').send({ name: '!!!' })).status).toBe(422)
  })

  it('renaming never changes the address', async () => {
    const res = await admin('put', '/categories/roses').send({ name: 'Garden Roses', description: 'x', imageUrl: 'https://img.example/c.jpg', sortOrder: 1, isActive: true })
    expect(res.body).toMatchObject({ id: 'roses', slug: 'roses', name: 'Garden Roses', imageUrl: 'https://img.example/c.jpg' })
    expect((await admin('put', '/categories/missing').send({ name: 'X' })).status).toBe(404)
    expect((await admin('put', '/categories/roses').send({ name: 'X', imageUrl: 'http://insecure' })).status).toBe(400)
    expect((await admin('put', '/categories/roses').send({ name: 'X', imageUrl: '/images/categories/roses.webp' })).status).toBe(200)
  })

  it('cannot be deleted while it holds products', async () => {
    await makeProduct({ slug: 'a', category: 'roses' })
    const blocked = await admin('delete', '/categories/roses')
    expect(blocked.status).toBe(422)
    expect(blocked.body.error.message).toBe('Move or delete the 1 product in this category first.')
    await makeProduct({ slug: 'b', category: 'roses' })
    expect((await admin('delete', '/categories/roses')).body.error.message).toBe('Move or delete the 2 products in this category first.')

    await makeCategory('empty')
    expect((await admin('delete', '/categories/empty')).status).toBe(204)
    expect((await admin('delete', '/categories/empty')).status).toBe(404)
  })

  it('hiding a category hides its products from the shop', async () => {
    await makeProduct({ slug: 'a', category: 'roses' })
    expect((await publicGet('/products')).body).toHaveLength(1)
    await admin('put', '/categories/roses').send({ name: 'Roses', isActive: false })
    expect((await publicGet('/products')).body).toHaveLength(0)
    expect((await publicGet('/categories')).body).toHaveLength(0)
  })
})

describe('photo uploads (Cloudinary)', () => {
  const original = { ...env.cloudinary }
  afterEach(() => Object.assign(env.cloudinary, original))

  it('says so clearly when Cloudinary is not set up', async () => {
    Object.assign(env.cloudinary, { configured: false })
    const res = await admin('post', '/uploads/sign')
    expect(res.status).toBe(503)
    expect(res.body.error.message).toMatch(/not set up yet.*paste a link/i)
  })

  it('hands out a signature the browser can use, and never the secret', async () => {
    Object.assign(env.cloudinary, { configured: true, cloudName: 'demo', apiKey: '123456', apiSecret: 'shh-secret', folder: 'ceylon-petals/products' })
    const res = await admin('post', '/uploads/sign')
    expect(res.status).toBe(200)
    const { uploadUrl, params } = res.body
    expect(uploadUrl).toBe('https://api.cloudinary.com/v1_1/demo/image/upload')
    expect(params).toMatchObject({ api_key: '123456', folder: 'ceylon-petals/products', allowed_formats: 'jpg,jpeg,png,webp,avif' })
    const expected = createHash('sha1').update(`allowed_formats=jpg,jpeg,png,webp,avif&folder=ceylon-petals/products&timestamp=${params.timestamp}shh-secret`).digest('hex')
    expect(params.signature).toBe(expected)
    expect(JSON.stringify(res.body)).not.toContain('shh-secret')
  })

  it('is for the owner only', async () => {
    expect((await request(app).post('/api/admin/uploads/sign').set('Origin', ORIGIN)).status).toBe(401)
  })
})

describe('Cloudinary helpers', () => {
  const original = { ...env.cloudinary }
  beforeEach(() => Object.assign(env.cloudinary, { configured: true, cloudName: 'demo', apiKey: 'key', apiSecret: 'abcd' }))
  afterEach(() => Object.assign(env.cloudinary, original))

  it("signs exactly as Cloudinary's documentation does", () => {
    // The worked example from Cloudinary's "Generating authentication signatures" page.
    const signature = signParams({ eager: 'w_400,h_300,c_pad|w_260,h_200,c_crop', public_id: 'sample_image', timestamp: 1315060510 }, 'abcd')
    expect(signature).toBe('bfd09f95f331f558cbd1320e67aa8d488770583e')
  })

  it('finds the public id of our own photos only', () => {
    const base = 'https://res.cloudinary.com/demo/image/upload'
    expect(publicIdFromUrl(`${base}/v1700000000/ceylon-petals/products/abc123.jpg`)).toBe('ceylon-petals/products/abc123')
    expect(publicIdFromUrl(`${base}/ceylon-petals/products/abc123.webp`)).toBe('ceylon-petals/products/abc123')
    expect(publicIdFromUrl('https://res.cloudinary.com/someone-else/image/upload/v1/x/y.jpg')).toBeNull()
    expect(publicIdFromUrl('https://images.unsplash.com/photo-1.jpg')).toBeNull()
    env.cloudinary.configured = false
    expect(publicIdFromUrl(`${base}/v1/x/y.jpg`)).toBeNull()
  })

  it('asks Cloudinary to delete a photo with a signed request, and never throws', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    await deleteCloudinaryImage('ceylon-petals/products/abc')
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://api.cloudinary.com/v1_1/demo/image/destroy')
    const body = new URLSearchParams(init.body as URLSearchParams)
    expect(body.get('public_id')).toBe('ceylon-petals/products/abc')
    expect(body.get('signature')).toBe(signParams({ public_id: 'ceylon-petals/products/abc', timestamp: Number(body.get('timestamp')) }, 'abcd'))

    fetchMock.mockRejectedValueOnce(new Error('network down'))
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    await expect(deleteCloudinaryImage('x')).resolves.toBeUndefined()
    vi.unstubAllGlobals()
  })

  it('removing a photo from a product deletes it from Cloudinary, unless something else still uses it', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    const mine = 'https://res.cloudinary.com/demo/image/upload/v1/ceylon-petals/products/mine.jpg'
    const shared = 'https://res.cloudinary.com/demo/image/upload/v1/ceylon-petals/products/shared.jpg'
    const keep = 'https://img.example/keep.jpg'

    const product = (await admin('post', '/products').send(validProduct({ images: [mine, shared, keep] }))).body
    await admin('post', '/products').send(validProduct({ name: 'Other', images: [shared] })) // also uses `shared`

    await admin('put', `/products/${product.id}`).send(validProduct({ images: [keep] })) // drops mine and shared
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const body = new URLSearchParams(fetchMock.mock.calls[0]![1].body as URLSearchParams)
    expect(body.get('public_id')).toBe('ceylon-petals/products/mine') // shared is still used by the other product
    vi.unstubAllGlobals()
  })
})
