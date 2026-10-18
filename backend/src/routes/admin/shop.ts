import { Router } from 'express'
import { z } from 'zod'
import { DISTRICTS } from '../../lib/districts.js'
import { emailSchema, idParams, phoneSchema, textSchema } from '../../lib/validation.js'
import { getAnalytics } from '../../services/analytics.js'
import { listCustomers } from '../../services/customers.js'
import { adminListInquiries, updateInquiry } from '../../services/inquiries.js'
import { getAdminSettings, updateAdminSettings } from '../../services/adminSettings.js'

// Settings, inquiries, customers and analytics.
export const adminShopRouter = Router()

// ---------------------------------------------------------------- settings

const zone = z.object({
  district: z.enum(DISTRICTS, { error: 'Please choose a district' }),
  fee: z.number().int().min(0).max(100_000),
  sameDay: z.boolean(),
  active: z.boolean(),
})

const promo = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{3,30}$/, 'Promo codes use letters, numbers, - and _ (3 to 30 characters)'),
    type: z.enum(['PERCENT', 'FIXED']),
    value: z.number().int().min(1, 'The discount must be above zero').max(1_000_000),
    minOrder: z.number().int().min(0).max(10_000_000).default(0),
    active: z.boolean(),
    description: z.string().trim().max(200).default(''),
  })
  .refine((p) => p.type !== 'PERCENT' || p.value <= 100, { message: 'A percentage discount cannot be more than 100', path: ['value'] })

// A social profile link: empty (= hidden) or a full https:// address on that network.
const socialLink = (host: RegExp, name: string) =>
  z
    .string()
    .trim()
    .max(300)
    .refine((u) => {
      if (u === '') return true
      try {
        const url = new URL(u)
        return url.protocol === 'https:' && host.test(url.hostname)
      } catch {
        return false
      }
    }, `Please paste the full ${name} link, starting with https://`)

const unique = <T>(items: T[], key: (item: T) => string) => new Set(items.map(key)).size === items.length

const settingsBody = z
  .object({
    shopName: textSchema('the shop name', 100).optional(),
    tagline: z.string().trim().max(150).optional(),
    whatsappNumber: phoneSchema.optional(),
    phone: z.string().trim().max(40).optional(),
    email: z.union([z.literal(''), emailSchema]).optional(),
    address: z.string().trim().max(300).optional(),
    openingHours: z.string().trim().max(200).optional(),
    sameDayCutoff: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use the time format HH:MM, for example 14:00').optional(),
    acceptingOrders: z.boolean().optional(),
    freeDeliveryOver: z.number().int().min(0).max(10_000_000).optional(),
    announcement: z.string().trim().max(160, 'Keep the announcement under 160 characters').optional(),
    instagramUrl: socialLink(/(^|\.)instagram\.com$/, 'Instagram').optional(),
    facebookUrl: socialLink(/(^|\.)(facebook\.com|fb\.com)$/, 'Facebook').optional(),
    tiktokUrl: socialLink(/(^|\.)tiktok\.com$/, 'TikTok').optional(),
    deliveryZones: z.array(zone).max(25).refine((z) => unique(z, (x) => x.district), 'Two delivery zones are the same district').optional(),
    promoCodes: z.array(promo).max(100).refine((p) => unique(p, (x) => x.code), 'Two promo codes have the same code').optional(),
  })

// GET /api/admin/settings   (everything, including every zone and promo code)
adminShopRouter.get('/settings', async (_req, res) => {
  res.json(await getAdminSettings())
})

// PATCH /api/admin/settings   Send only what changed. Zone and promo lists replace the whole list.
adminShopRouter.patch('/settings', async (req, res) => {
  res.json(await updateAdminSettings(settingsBody.parse(req.body) as Parameters<typeof updateAdminSettings>[0]))
})

// ---------------------------------------------------------------- inquiries

const inquiryChanges = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'QUOTED', 'CONFIRMED', 'CLOSED']).optional(),
  ownerNotes: z.string().trim().max(2000).optional(),
})

adminShopRouter.get('/inquiries', async (_req, res) => {
  res.json(await adminListInquiries())
})

adminShopRouter.patch('/inquiries/:id', async (req, res) => {
  res.json(await updateInquiry(idParams.parse(req.params).id, inquiryChanges.parse(req.body)))
})

// ---------------------------------------------------------------- customers and analytics

adminShopRouter.get('/customers', async (_req, res) => {
  res.json(await listCustomers())
})

// GET /api/admin/analytics?days=30
adminShopRouter.get('/analytics', async (req, res) => {
  const { days } = z.object({ days: z.coerce.number().int().min(1).max(365).default(30) }).parse(req.query)
  res.json(await getAnalytics(days))
})
