import type { Category, OccasionSlug, Product } from '../types'
import { commit, db, delay, fail, newId } from './mockDb'

// Future endpoints:
//   GET    /api/products?category=&occasion=&q=&tag=&featured=     (shop)
//   GET    /api/products/:slug
//   GET    /api/categories
//   GET    /api/admin/products            POST /api/admin/products
//   PUT    /api/admin/products/:id        PATCH /api/admin/products/:id/stock
//   POST   /api/admin/categories          PUT/DELETE /api/admin/categories/:id

export interface ProductQuery {
  categoryId?: string
  occasion?: OccasionSlug
  q?: string
  tag?: string
  featured?: boolean
}

function visibleCategoryIds(): Set<string> {
  return new Set(db().categories.filter((c) => c.isActive).map((c) => c.id))
}

// "lilies" → "lily", "roses" → "rose", so singular and plural searches both match.
function singular(word: string): string {
  if (word.endsWith('ies') && word.length > 4) return `${word.slice(0, -3)}y`
  if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) return word.slice(0, -1)
  return word
}

function words(text: string): string[] {
  return text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).map(singular)
}

function matchesSearch(p: Product, q: string): boolean {
  const haystack = words([p.name, p.shortDescription, ...p.flowerTypes, ...p.colours, ...p.occasions, p.categoryId].join(' ')).join(' ')
  return words(q).every((word) => haystack.includes(word))
}

/** Products a customer can see (active, in an active category). */
export function listProducts(query: ProductQuery = {}): Promise<Product[]> {
  const categories = visibleCategoryIds()
  const result = db().products.filter((p) => {
    if (!p.isActive || !categories.has(p.categoryId)) return false
    if (query.categoryId && p.categoryId !== query.categoryId) return false
    if (query.occasion && !p.occasions.includes(query.occasion)) return false
    if (query.tag && !p.tags.includes(query.tag)) return false
    if (query.featured && !p.isFeatured) return false
    if (query.q && !matchesSearch(p, query.q)) return false
    return true
  })
  return delay(result)
}

export function getProduct(slug: string): Promise<Product | null> {
  const p = db().products.find((x) => x.slug === slug && x.isActive)
  return delay(p && visibleCategoryIds().has(p.categoryId) ? p : null)
}

export function listCategories(): Promise<Category[]> {
  return delay(
    db()
      .categories.filter((c) => c.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  )
}

// ---------------- Owner ----------------

export function adminListProducts(): Promise<Product[]> {
  return delay(db().products)
}

export function adminGetProduct(id: string): Promise<Product | null> {
  return delay(db().products.find((p) => p.id === id) ?? null)
}

export type ProductInput = Omit<Product, 'id' | 'slug' | 'createdAt'> & { id?: string; slug?: string }

function slugify(text: string): string {
  return text.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function uniqueSlug(base: string, ownId?: string): string {
  let slug = base || 'product'
  let i = 2
  while (db().products.some((p) => p.slug === slug && p.id !== ownId)) slug = `${base}-${i++}`
  return slug
}

export function saveProduct(input: ProductInput): Promise<Product> {
  if (!input.name.trim()) return fail('Please enter a product name.')
  if (!(input.price > 0)) return fail('Please enter a price above zero.')
  if (input.discountPrice !== undefined && input.discountPrice >= input.price) {
    return fail('The sale price must be lower than the regular price.')
  }
  if (input.images.length === 0) return fail('Please add at least one photo.')

  const products = db().products
  const existing = input.id ? products.find((p) => p.id === input.id) : undefined
  const slug = uniqueSlug(slugify(input.slug || input.name), existing?.id)
  const saved: Product = existing
    ? { ...existing, ...input, id: existing.id, slug }
    : { ...input, id: newId('p'), slug, createdAt: new Date().toISOString() }

  if (existing) products[products.indexOf(existing)] = saved
  else products.unshift(saved)
  commit()
  return delay(saved)
}

export function setProductActive(id: string, isActive: boolean): Promise<Product> {
  const p = db().products.find((x) => x.id === id)
  if (!p) return fail('Product not found.')
  p.isActive = isActive
  commit()
  return delay(p)
}

// Past orders keep their own copy of the name, price and photo, so they are not affected.
// Carts that still hold the product are stopped at checkout ("no longer available").
export function deleteProduct(id: string): Promise<void> {
  const data = db()
  if (!data.products.some((p) => p.id === id)) return fail('Product not found.')
  data.products = data.products.filter((p) => p.id !== id)
  commit()
  return delay(undefined)
}

export function updateStock(id: string, stock: number): Promise<Product> {
  const p = db().products.find((x) => x.id === id)
  if (!p) return fail('Product not found.')
  p.stock = Math.max(0, Math.floor(stock))
  commit()
  return delay(p)
}

export function adminListCategories(): Promise<(Category & { productCount: number })[]> {
  const products = db().products
  return delay(
    [...db().categories]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c) => ({ ...c, productCount: products.filter((p) => p.categoryId === c.id).length }))
  )
}

export function saveCategory(raw: Omit<Category, 'id' | 'slug'> & { id?: string }): Promise<Category> {
  // Only keep known fields (the admin list adds extras like productCount).
  const input = { id: raw.id, name: raw.name.trim(), description: raw.description, imageUrl: raw.imageUrl, sortOrder: raw.sortOrder, isActive: raw.isActive }
  if (!input.name) return fail('Please enter a category name.')
  const categories = db().categories
  const existing = input.id ? categories.find((c) => c.id === input.id) : undefined
  if (existing) {
    Object.assign(existing, input, { id: existing.id, slug: existing.slug })
    commit()
    return delay(existing)
  }
  const slug = slugify(input.name)
  if (categories.some((c) => c.slug === slug)) return fail('A category with this name already exists.')
  const created: Category = { ...input, id: slug, slug }
  categories.push(created)
  commit()
  return delay(created)
}

export function deleteCategory(id: string): Promise<void> {
  const inUse = db().products.filter((p) => p.categoryId === id).length
  if (inUse > 0) return fail(`Move or delete the ${inUse} products in this category first.`)
  db().categories = db().categories.filter((c) => c.id !== id)
  commit()
  return delay(undefined)
}
