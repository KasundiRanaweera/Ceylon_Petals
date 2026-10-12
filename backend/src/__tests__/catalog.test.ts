import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

// Replace the real database with a fake so these tests are fast and touch nothing real.
const findMany = vi.fn()
const findFirst = vi.fn()
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    product: { findMany: (...a: unknown[]) => findMany(...a), findFirst: (...a: unknown[]) => findFirst(...a) },
    category: { findMany: vi.fn().mockResolvedValue([]) },
    occasion: { findMany: vi.fn().mockResolvedValue([]) },
  },
}))

const { createApp } = await import('../app.js')
const { matchesSearch, sortProducts, effectivePrice, toProductDto } = await import('../services/catalog.js')
type Dto = ReturnType<typeof toProductDto>

function row(over: Record<string, unknown> = {}) {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    slug: 'casablanca-lilies',
    name: 'Casablanca Pure Ivory Lilies',
    shortDescription: 'Fragrant oriental lilies',
    description: 'Long description',
    price: 19800,
    discountPrice: null,
    stock: 3,
    lowStockThreshold: 10,
    isFeatured: false,
    isActive: true,
    sameDay: true,
    badge: null,
    details: ['10 stems'],
    flowerTypes: ['Lilies'],
    colours: ['White'],
    tags: [],
    attributes: null,
    createdAt: new Date('2026-07-05T00:00:00Z'),
    images: [{ url: 'https://img/1.jpg' }, { url: 'https://img/2.jpg' }],
    occasions: [{ slug: 'sympathy' }],
    category: { slug: 'lilies-orchids' },
    ...over,
  }
}

describe('toProductDto', () => {
  it('matches the frontend Product shape', () => {
    const dto = toProductDto(row({ discountPrice: 17000, badge: 'Fragrant', attributes: { Light: 'Bright' } }) as never)
    expect(dto.categoryId).toBe('lilies-orchids') // the category slug, not the database id
    expect(dto.images).toEqual(['https://img/1.jpg', 'https://img/2.jpg'])
    expect(dto.occasions).toEqual(['sympathy'])
    expect(dto.discountPrice).toBe(17000)
    expect(dto.badge).toBe('Fragrant')
    expect(dto.attributes).toEqual({ Light: 'Bright' })
    expect(dto.createdAt).toBe('2026-07-05T00:00:00.000Z')
  })

  it('leaves out optional fields that are empty', () => {
    const dto = toProductDto(row() as never)
    expect('discountPrice' in dto).toBe(false)
    expect('badge' in dto).toBe(false)
    expect('attributes' in dto).toBe(false)
  })
})

describe('search', () => {
  const dto = toProductDto(row() as never)
  it('matches singular and plural forms', () => {
    expect(matchesSearch(dto, 'lily')).toBe(true)
    expect(matchesSearch(dto, 'lilies')).toBe(true)
    expect(matchesSearch(dto, 'white lily')).toBe(true)
  })
  it('requires every word to match', () => {
    expect(matchesSearch(dto, 'lily red')).toBe(false)
    expect(matchesSearch(dto, 'daffodil')).toBe(false)
  })
  it('searches the category and occasion too', () => {
    expect(matchesSearch(dto, 'sympathy')).toBe(true)
    expect(matchesSearch(dto, 'orchid')).toBe(true) // the category is "lilies-orchids"
  })
})

describe('sorting', () => {
  const make = (slug: string, price: number, discountPrice: number | null, featured: boolean, day: number): Dto =>
    toProductDto(row({ slug, price, discountPrice, isFeatured: featured, createdAt: new Date(Date.UTC(2026, 6, day)) }) as never)
  const a = make('a', 10000, null, false, 1)
  const b = make('b', 20000, 9000, false, 2) // on sale: really costs 9,000
  const c = make('c', 15000, null, true, 3)

  it('uses the sale price when sorting by price', () => {
    expect(effectivePrice(b)).toBe(9000)
    expect(sortProducts([a, b, c], 'price-asc').map((p) => p.slug)).toEqual(['b', 'a', 'c'])
    expect(sortProducts([a, b, c], 'price-desc').map((p) => p.slug)).toEqual(['c', 'a', 'b'])
  })
  it('puts featured first, then newest', () => {
    expect(sortProducts([a, b, c], 'featured').map((p) => p.slug)).toEqual(['c', 'b', 'a'])
  })
  it('sorts newest first', () => {
    expect(sortProducts([a, b, c], 'newest').map((p) => p.slug)).toEqual(['c', 'b', 'a'])
  })
})

describe('GET /api/products', () => {
  const app = createApp()
  beforeEach(() => {
    findMany.mockReset()
    findFirst.mockReset()
  })

  it('only asks the database for active products in active categories', async () => {
    findMany.mockResolvedValue([])
    await request(app).get('/api/products')
    const where = findMany.mock.calls[0]?.[0].where
    expect(where.isActive).toBe(true)
    expect(where.category.isActive).toBe(true)
  })

  it('passes filters through (categoryId and category both mean the slug)', async () => {
    findMany.mockResolvedValue([])
    await request(app).get('/api/products?categoryId=roses&occasion=love&featured=true&inStock=1&tag=tea')
    const where = findMany.mock.calls[0]?.[0].where
    expect(where.category.slug).toBe('roses')
    expect(where.occasions).toEqual({ some: { slug: 'love' } })
    expect(where.isFeatured).toBe(true)
    expect(where.stock).toEqual({ gt: 0 })
    expect(where.tags).toEqual({ has: 'tea' })
  })

  it('searches with plurals and returns frontend-shaped products', async () => {
    findMany.mockResolvedValue([row(), row({ slug: 'roses', name: 'Red Roses', flowerTypes: ['Roses'], colours: ['Red'], shortDescription: 'Roses', category: { slug: 'roses' } })])
    const res = await request(app).get('/api/products?q=lily')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].slug).toBe('casablanca-lilies')
  })

  it('rejects a bad sort value with a 400', async () => {
    const res = await request(app).get('/api/products?sort=random')
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('applies the limit', async () => {
    findMany.mockResolvedValue([row({ slug: 'a' }), row({ slug: 'b' }), row({ slug: 'c' })])
    const res = await request(app).get('/api/products?limit=2')
    expect(res.body).toHaveLength(2)
  })
})

describe('GET /api/products/:slug', () => {
  const app = createApp()
  it('returns the product', async () => {
    findFirst.mockResolvedValue(row())
    const res = await request(app).get('/api/products/casablanca-lilies')
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Casablanca Pure Ivory Lilies')
  })

  it('returns 404 for hidden or unknown products', async () => {
    findFirst.mockResolvedValue(null)
    const res = await request(app).get('/api/products/does-not-exist')
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
    // The query itself must exclude hidden products.
    const where = findFirst.mock.calls.at(-1)?.[0].where
    expect(where.isActive).toBe(true)
    expect(where.category.isActive).toBe(true)
  })
})
