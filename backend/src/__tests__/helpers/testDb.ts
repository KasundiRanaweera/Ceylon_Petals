import { randomUUID } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { PrismaPGlite } from 'pglite-prisma-adapter'
import { PrismaClient } from '../../generated/prisma/client.js'
import { signAuthToken } from '../../lib/tokens.js'

// A real PostgreSQL running in memory (PGlite), built from the project's own migrations and used
// through the real Prisma client. Tests that use it exercise genuine SQL: constraints, sequences,
// transactions and rollbacks behave exactly as they do on Supabase.
//
// Use it from a test file like this:
//   vi.mock('../lib/prisma.js', async () => ({ prisma: (await import('./helpers/testDb.js')).prisma }))
//   beforeEach(resetDb)

const pg = new PGlite()
export const prisma = new PrismaClient({ adapter: new PrismaPGlite(pg) })

let migrated: Promise<void> | undefined

async function migrate() {
  const root = join(process.cwd(), 'prisma', 'migrations')
  for (const dir of readdirSync(root).filter((d) => /^\d/.test(d)).sort()) {
    await pg.exec(readFileSync(join(root, dir, 'migration.sql'), 'utf8'))
  }
}

/** Builds the schema once, then empties every table (and restarts the order/inquiry numbers). */
export async function resetDb() {
  await (migrated ??= migrate())
  await pg.exec(`
    TRUNCATE "User","Address","Category","Occasion","Product","ProductImage","Order","OrderItem",
             "OrderStatusHistory","Inquiry","DeliveryZone","PromoCode","ShopSettings","Review","_OccasionToProduct"
             RESTART IDENTITY CASCADE;
    ALTER SEQUENCE "Order_number_seq" RESTART WITH 1050;
    ALTER SEQUENCE "Inquiry_number_seq" RESTART WITH 104;
  `)
}

// ---------------------------------------------------------------- builders

export async function seedShop() {
  await prisma.shopSettings.create({
    data: {
      id: 1, shopName: 'Ceylon Petals', tagline: 'Flower studio', whatsappNumber: '94771234567', phone: '+94 11 234 5678',
      email: 'hello@ceylonpetals.lk', address: 'Colombo 07', openingHours: '8-9', sameDayCutoff: '14:00', freeDeliveryOver: 25000,
    },
  })
  await prisma.deliveryZone.createMany({
    data: [
      { district: 'Colombo', fee: 500, sameDay: true, active: true },
      { district: 'Kandy', fee: 1800, sameDay: false, active: true },
      { district: 'Galle', fee: 1800, sameDay: false, active: false },
    ],
  })
  await prisma.promoCode.create({ data: { code: 'WELCOME10', type: 'PERCENT', value: 10, minOrder: 10000, description: '10% off' } })
  await prisma.occasion.createMany({
    data: [
      { slug: 'birthday', name: 'Birthday', sortOrder: 1 },
      { slug: 'love', name: 'Love', sortOrder: 2 },
      { slug: 'sympathy', name: 'Sympathy', sortOrder: 3 },
    ],
  })
}

export async function makeCategory(slug = 'roses', over: Record<string, unknown> = {}) {
  return prisma.category.create({ data: { slug, name: slug.charAt(0).toUpperCase() + slug.slice(1), ...over } })
}

export async function makeProduct(over: { slug?: string; name?: string; category?: string; price?: number; stock?: number; discountPrice?: number; isActive?: boolean; sameDay?: boolean; images?: string[] } = {}) {
  const slug = over.slug ?? `product-${randomUUID().slice(0, 8)}`
  const category = await prisma.category.findUnique({ where: { slug: over.category ?? 'roses' } }) ?? (await makeCategory(over.category ?? 'roses'))
  return prisma.product.create({
    data: {
      slug, name: over.name ?? slug, categoryId: category.id, shortDescription: 'short', description: 'long',
      price: over.price ?? 10000, discountPrice: over.discountPrice ?? null, stock: over.stock ?? 5,
      isActive: over.isActive ?? true, sameDay: over.sameDay ?? true,
      details: [], flowerTypes: [], colours: [], tags: [],
      images: { create: (over.images ?? [`https://img.example/${slug}.jpg`]).map((url, position) => ({ url, position })) },
    },
  })
}

export async function makeUser(role: 'CUSTOMER' | 'OWNER' = 'CUSTOMER', over: { email?: string; phone?: string; name?: string } = {}) {
  const user = await prisma.user.create({
    data: {
      name: over.name ?? (role === 'OWNER' ? 'Shop Owner' : 'Test Customer'),
      email: over.email ?? `${role.toLowerCase()}-${randomUUID().slice(0, 6)}@example.com`,
      phone: over.phone ?? '94770000000', passwordHash: 'not-a-real-hash', role,
    },
  })
  return { user, cookie: `cp_session=${signAuthToken(user)}` }
}

export interface OrderOverrides {
  status?: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'PAYMENT_FAILED'
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  paymentMethod?: 'CARD' | 'CASH_ON_DELIVERY' | 'WHATSAPP'
  userId?: string | null
  customerName?: string
  customerPhone?: string
  district?: string
  total?: number
  createdAt?: Date
  items?: { productId: string | null; name: string; unitPrice: number; quantity: number }[]
}

export async function makeOrder(over: OrderOverrides = {}) {
  const items = over.items ?? []
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
  return prisma.order.create({
    data: {
      userId: over.userId ?? null,
      customerName: over.customerName ?? 'Amaya Fernando', customerPhone: over.customerPhone ?? '94771234567',
      recipientName: 'Dilini', recipientPhone: '94715556666', address: '12 Lake Road', area: 'Colombo 07',
      district: over.district ?? 'Colombo', deliveryDate: new Date('2026-12-25T00:00:00Z'), deliverySlot: 'MORNING',
      subtotal, deliveryFee: 500, total: over.total ?? subtotal + 500,
      paymentMethod: over.paymentMethod ?? 'CASH_ON_DELIVERY', paymentStatus: over.paymentStatus ?? 'PENDING',
      status: over.status ?? 'PENDING', ...(over.createdAt ? { createdAt: over.createdAt } : {}),
      items: { create: items.map((i, position) => ({ ...i, position })) },
      history: { create: { status: over.status ?? 'PENDING' } },
    },
  })
}
