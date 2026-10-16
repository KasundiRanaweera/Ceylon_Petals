import type { Category, OccasionSlug, Product } from '../types'
import { del, get, isMissing, patch, post, put } from '../lib/api'

// Shop pages read /api/products and /api/categories. The owner pages use /api/admin/*.

export interface ProductQuery {
  categoryId?: string
  occasion?: OccasionSlug
  q?: string
  tag?: string
  featured?: boolean
}

/** Products a customer can see (active, in an active category). */
export function listProducts(query: ProductQuery = {}): Promise<Product[]> {
  return get<Product[]>('/products', query)
}

export async function getProduct(slug: string): Promise<Product | null> {
  try {
    return await get<Product>(`/products/${encodeURIComponent(slug)}`)
  } catch (error) {
    if (isMissing(error)) return null
    throw error
  }
}

export function listCategories(): Promise<Category[]> {
  return get<Category[]>('/categories')
}

// ---------------- Owner ----------------

export function adminListProducts(): Promise<Product[]> {
  return get<Product[]>('/admin/products')
}

export async function adminGetProduct(id: string): Promise<Product | null> {
  try {
    return await get<Product>(`/admin/products/${id}`)
  } catch (error) {
    if (isMissing(error)) return null
    throw error
  }
}

/** What the product form sends. The web address (slug) is made by the server and never changes. */
export type ProductInput = Omit<Product, 'id' | 'slug' | 'createdAt'> & { id?: string; slug?: string }

export function saveProduct(input: ProductInput): Promise<Product> {
  // null (not "missing") tells the server to clear the sale price, badge or plant facts.
  const body = {
    name: input.name,
    categoryId: input.categoryId,
    shortDescription: input.shortDescription,
    description: input.description,
    price: input.price,
    discountPrice: input.discountPrice ?? null,
    stock: input.stock,
    lowStockThreshold: input.lowStockThreshold,
    badge: input.badge || null,
    isFeatured: input.isFeatured,
    isActive: input.isActive,
    sameDay: input.sameDay,
    occasions: input.occasions,
    images: input.images,
    details: input.details,
    flowerTypes: input.flowerTypes,
    colours: input.colours,
    tags: input.tags,
    attributes: input.attributes && Object.keys(input.attributes).length > 0 ? input.attributes : null,
  }
  return input.id ? put<Product>(`/admin/products/${input.id}`, body) : post<Product>('/admin/products', body)
}

export function setProductActive(id: string, isActive: boolean): Promise<Product> {
  return patch<Product>(`/admin/products/${id}/active`, { isActive })
}

// Past orders keep their own copy of the name, price and photo, so they are not affected.
export function deleteProduct(id: string): Promise<void> {
  return del(`/admin/products/${id}`)
}

export function updateStock(id: string, stock: number): Promise<Product> {
  return patch<Product>(`/admin/products/${id}/stock`, { stock: Math.max(0, Math.floor(stock)) })
}

export function adminListCategories(): Promise<(Category & { productCount: number })[]> {
  return get<(Category & { productCount: number })[]>('/admin/categories')
}

export function saveCategory(raw: Omit<Category, 'id' | 'slug'> & { id?: string }): Promise<Category> {
  // Only send the fields the server knows (the admin list adds extras like productCount).
  const body = { name: raw.name.trim(), description: raw.description, imageUrl: raw.imageUrl, sortOrder: raw.sortOrder, isActive: raw.isActive }
  return raw.id ? put<Category>(`/admin/categories/${raw.id}`, body) : post<Category>('/admin/categories', body)
}

export function deleteCategory(id: string): Promise<void> {
  return del(`/admin/categories/${id}`)
}
