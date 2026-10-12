import type { Prisma } from '../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'
import { notFound } from '../lib/errors.js'

// Catalogue reads for the public shop. Everything here only ever returns what a customer is
// allowed to see: active products that sit in an active category.
//
// The JSON shapes match frontend/src/types/index.ts (Product, Category, Occasion), so the
// pages need no changes. One convention to know: the public `Category.id` and
// `Product.categoryId` are the category SLUG (e.g. "luxury-hampers"), exactly like the demo
// data, because the frontend compares them to slugs in several places. Slugs are unique and
// never change, so they are safe to use as public ids.

const productInclude = {
  images: { orderBy: { position: 'asc' }, select: { url: true } },
  occasions: { select: { slug: true } },
  category: { select: { slug: true } },
} satisfies Prisma.ProductInclude

type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>

export interface ProductDto {
  id: string
  slug: string
  name: string
  categoryId: string
  occasions: string[]
  shortDescription: string
  description: string
  images: string[]
  price: number
  discountPrice?: number
  stock: number
  lowStockThreshold: number
  isFeatured: boolean
  isActive: boolean
  badge?: string
  details: string[]
  flowerTypes: string[]
  colours: string[]
  tags: string[]
  sameDay: boolean
  attributes?: Record<string, string>
  createdAt: string
}

export function toProductDto(p: ProductRow): ProductDto {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    categoryId: p.category.slug,
    occasions: p.occasions.map((o) => o.slug),
    shortDescription: p.shortDescription,
    description: p.description,
    images: p.images.map((i) => i.url),
    price: p.price,
    ...(p.discountPrice != null ? { discountPrice: p.discountPrice } : {}),
    stock: p.stock,
    lowStockThreshold: p.lowStockThreshold,
    isFeatured: p.isFeatured,
    isActive: p.isActive,
    ...(p.badge ? { badge: p.badge } : {}),
    details: p.details,
    flowerTypes: p.flowerTypes,
    colours: p.colours,
    tags: p.tags,
    sameDay: p.sameDay,
    ...(p.attributes && typeof p.attributes === 'object' ? { attributes: p.attributes as Record<string, string> } : {}),
    createdAt: p.createdAt.toISOString(),
  }
}

export interface CategoryDto {
  id: string
  slug: string
  name: string
  description: string
  imageUrl: string
  sortOrder: number
  isActive: boolean
}

export function toCategoryDto(c: {
  slug: string
  name: string
  description: string
  imageUrl: string
  sortOrder: number
  isActive: boolean
}): CategoryDto {
  return {
    id: c.slug,
    slug: c.slug,
    name: c.name,
    description: c.description,
    imageUrl: c.imageUrl,
    sortOrder: c.sortOrder,
    isActive: c.isActive,
  }
}

// ---------------------------------------------------------------- search and sorting

// "lilies" -> "lily", "roses" -> "rose", so singular and plural searches both match.
// Same rule as the frontend, so results do not change when the site moves off the demo data.
function singular(word: string): string {
  if (word.endsWith('ies') && word.length > 4) return `${word.slice(0, -3)}y`
  if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) return word.slice(0, -1)
  return word
}

function words(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map(singular)
}

/** Every word the customer typed must appear somewhere in the product's searchable text. */
export function matchesSearch(p: ProductDto, query: string): boolean {
  const haystack = words([p.name, p.shortDescription, ...p.flowerTypes, ...p.colours, ...p.occasions, p.categoryId].join(' ')).join(' ')
  return words(query).every((word) => haystack.includes(word))
}

export const effectivePrice = (p: Pick<ProductDto, 'price' | 'discountPrice'>) =>
  p.discountPrice != null && p.discountPrice < p.price ? p.discountPrice : p.price

export type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'newest'

export function sortProducts(products: ProductDto[], sort: SortKey): ProductDto[] {
  const byNewest = (a: ProductDto, b: ProductDto) => b.createdAt.localeCompare(a.createdAt)
  const list = [...products]
  switch (sort) {
    case 'price-asc':
      return list.sort((a, b) => effectivePrice(a) - effectivePrice(b) || byNewest(a, b))
    case 'price-desc':
      return list.sort((a, b) => effectivePrice(b) - effectivePrice(a) || byNewest(a, b))
    case 'newest':
      return list.sort(byNewest)
    default:
      return list.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || byNewest(a, b))
  }
}

// ---------------------------------------------------------------- queries

export interface ProductFilters {
  /** Category slug. */
  category?: string | undefined
  occasion?: string | undefined
  tag?: string | undefined
  featured?: boolean | undefined
  inStock?: boolean | undefined
  q?: string | undefined
  sort: SortKey
  limit?: number | undefined
}

export async function listProducts(filters: ProductFilters): Promise<ProductDto[]> {
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    category: { isActive: true, ...(filters.category ? { slug: filters.category } : {}) },
    ...(filters.occasion ? { occasions: { some: { slug: filters.occasion } } } : {}),
    ...(filters.tag ? { tags: { has: filters.tag } } : {}),
    ...(filters.featured ? { isFeatured: true } : {}),
    ...(filters.inStock ? { stock: { gt: 0 } } : {}),
  }

  const rows = await prisma.product.findMany({ where, include: productInclude })
  let products = rows.map(toProductDto)
  // Text search is done here (not in SQL) so plurals match. A florist's catalogue is small
  // enough for this; if it ever reaches many thousands of products, move it to Postgres
  // full-text search.
  const query = filters.q?.trim()
  if (query) products = products.filter((p) => matchesSearch(p, query))
  products = sortProducts(products, filters.sort)
  return filters.limit ? products.slice(0, filters.limit) : products
}

export async function getProductBySlug(slug: string): Promise<ProductDto> {
  const row = await prisma.product.findFirst({
    where: { slug, isActive: true, category: { isActive: true } },
    include: productInclude,
  })
  if (!row) throw notFound('Product not found')
  return toProductDto(row)
}

export async function listCategories(): Promise<CategoryDto[]> {
  const rows = await prisma.category.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] })
  return rows.map(toCategoryDto)
}

export async function listOccasions() {
  const rows = await prisma.occasion.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] })
  return rows.map(({ slug, name, description }) => ({ slug, name, description }))
}
