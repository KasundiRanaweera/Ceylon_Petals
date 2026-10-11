import type { Address, Category, Inquiry, Product, ShopSettings, User } from '../types'
import type { AdminOrder } from '../types/admin'
import { createSeedDb } from '../data/seed'
import { SEED_PRODUCTS } from '../data/catalog'

// A tiny fake database kept in localStorage, so the whole site works end-to-end before the
// backend exists: an order placed at checkout shows up in the customer's account AND in the
// owner's Orders page.
//
// Only the files in src/services touch this. When the Express API is ready, replace each
// service function body with an axios call and delete this file — pages won't need to change.

export interface StoredUser extends User {
  /** Plain text ONLY because this is a browser mock. The backend must store a bcrypt hash. */
  password: string
}

export interface MockDb {
  version: number
  products: Product[]
  categories: Category[]
  orders: AdminOrder[]
  users: StoredUser[]
  addresses: Address[]
  inquiries: Inquiry[]
  settings: ShopSettings
  counters: { order: number; inquiry: number }
}

const STORAGE_KEY = 'ceylon-petals-db'
// Bump this whenever the seed data shape changes, so old browser copies are replaced.
const VERSION = 3

let cache: MockDb | null = null

function load(): MockDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as MockDb
      if (parsed.version === VERSION) return parsed
      if (parsed.version === 2) return upgradeFrom2(parsed)
    }
  } catch {
    // Private mode or corrupted data: fall through and start fresh.
  }
  const fresh = createSeedDb(VERSION)
  persist(fresh)
  return fresh
}

// Version 3 added new arrangements. Keep everything the owner and customers already saved,
// and just add the products this browser doesn't have yet.
function upgradeFrom2(data: MockDb): MockDb {
  const ids = new Set(data.products.map((p) => p.id))
  const slugs = new Set(data.products.map((p) => p.slug))
  for (const seed of SEED_PRODUCTS) {
    if (slugs.has(seed.slug)) continue
    data.products.push({ ...seed, id: ids.has(seed.id) ? newId('p') : seed.id })
  }
  data.version = VERSION
  persist(data)
  return data
}

function persist(data: MockDb) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Storage full or blocked: keep working in memory for this visit.
  }
}

export function db(): MockDb {
  if (!cache) cache = load()
  return cache
}

/** Save after a change. */
export function commit() {
  persist(db())
}

export function resetDb() {
  cache = createSeedDb(VERSION)
  persist(cache)
}

/** Pretend network latency, so loading states get exercised before the real API exists. */
export function delay<T>(value: T, ms = 180): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), ms))
}

export function fail(message: string, ms = 180): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms))
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}
