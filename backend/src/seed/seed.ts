import 'dotenv/config'
import { readFileSync } from 'node:fs'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { Prisma } from '../generated/prisma/client.js'

// Loads the starting data: occasions, categories, products, delivery zones, promo codes,
// shop settings and the owner account.
//
// Safe to run again at any time. It only CREATES what is missing, so it never overwrites a
// price, stock level or setting the owner changed later. (To start over completely, use
// `npx prisma migrate reset`, which wipes the database.)
//
// data/catalog.json and data/shop.json are snapshots of frontend/src/data (catalog.ts and
// settings.ts), so the real shop starts with exactly what the demo site showed.

interface CatalogFile {
  occasions: { slug: string; name: string; description: string }[]
  categories: { slug: string; name: string; description: string; imageUrl: string; sortOrder: number; isActive: boolean }[]
  products: {
    slug: string
    name: string
    category: string
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
    sameDay: boolean
    badge?: string
    details: string[]
    flowerTypes: string[]
    colours: string[]
    tags: string[]
    attributes?: Record<string, string>
  }[]
}

interface ShopFile {
  settings: {
    shopName: string
    tagline: string
    whatsappNumber: string
    phone: string
    email: string
    address: string
    openingHours: string
    sameDayCutoff: string
    acceptingOrders: boolean
    freeDeliveryOver: number
  }
  deliveryZones: { district: string; fee: number; sameDay: boolean; active: boolean }[]
  promoCodes: { code: string; type: 'PERCENT' | 'FIXED'; value: number; minOrder: number; active: boolean; description: string }[]
}

const readJson = <T>(name: string): T => JSON.parse(readFileSync(new URL(`./data/${name}`, import.meta.url), 'utf8')) as T

async function seedCatalog() {
  const { occasions, categories, products } = readJson<CatalogFile>('catalog.json')

  for (const [i, o] of occasions.entries()) {
    await prisma.occasion.upsert({ where: { slug: o.slug }, update: {}, create: { ...o, sortOrder: i } })
  }

  const categoryId = new Map<string, string>()
  for (const c of categories) {
    const row = await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c })
    categoryId.set(c.slug, row.id)
  }

  let created = 0
  for (const p of products) {
    const exists = await prisma.product.findUnique({ where: { slug: p.slug }, select: { id: true } })
    if (exists) continue
    const catId = categoryId.get(p.category)
    if (!catId) throw new Error(`Product ${p.slug} points at unknown category ${p.category}`)
    const { category: _category, occasions: occ, images, attributes, discountPrice, badge, ...rest } = p
    await prisma.product.create({
      data: {
        ...rest,
        discountPrice: discountPrice ?? null,
        badge: badge ?? null,
        attributes: attributes ?? Prisma.JsonNull,
        categoryId: catId,
        occasions: { connect: occ.map((slug) => ({ slug })) },
        images: { create: images.map((url, position) => ({ url, position })) },
      },
    })
    created++
  }
  console.log(`catalogue: ${occasions.length} occasions, ${categories.length} categories, ${created} new products (${products.length - created} already there)`)
}

async function seedShop() {
  const { settings, deliveryZones, promoCodes } = readJson<ShopFile>('shop.json')

  await prisma.shopSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1, ...settings } })
  for (const z of deliveryZones) {
    await prisma.deliveryZone.upsert({ where: { district: z.district }, update: {}, create: z })
  }
  for (const p of promoCodes) {
    await prisma.promoCode.upsert({ where: { code: p.code }, update: {}, create: p })
  }
  console.log(`shop: settings, ${deliveryZones.length} delivery zones, ${promoCodes.length} promo codes`)
}

async function seedOwner() {
  const email = process.env.OWNER_EMAIL?.trim().toLowerCase()
  const password = process.env.OWNER_PASSWORD
  if (!email || !password) {
    console.log('owner: skipped (set OWNER_EMAIL and OWNER_PASSWORD in backend/.env to create the owner account)')
    return
  }
  if (password.length < 8) throw new Error('OWNER_PASSWORD must be at least 8 characters.')

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    // Never change an existing password here. Only make sure the account is an owner.
    if (existing.role !== 'OWNER') await prisma.user.update({ where: { id: existing.id }, data: { role: 'OWNER' } })
    console.log(`owner: ${email} already exists`)
    return
  }
  await prisma.user.create({
    data: {
      name: process.env.OWNER_NAME?.trim() || 'Shop Owner',
      email,
      phone: process.env.OWNER_PHONE?.trim() || '',
      passwordHash: await bcrypt.hash(password, 12),
      role: 'OWNER',
    },
  })
  console.log(`owner: created ${email}`)
}

try {
  await seedCatalog()
  await seedShop()
  await seedOwner()
  console.log('seed finished')
} catch (error) {
  console.error('seed failed:', error)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
