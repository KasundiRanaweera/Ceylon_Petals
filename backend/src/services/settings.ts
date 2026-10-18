import type { Prisma } from '../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../lib/errors.js'

// Shop settings: the WhatsApp number, delivery zones, cut-off time and so on.
// The owner edits them in Admin -> Settings (Step 10); here we only read them.

type Db = Prisma.TransactionClient

/** The single settings row. Created by the seed script. */
export async function getSettingsRow(db: Db = prisma) {
  const row = await db.shopSettings.findUnique({ where: { id: 1 } })
  if (!row) throw new AppError(500, 'INTERNAL_ERROR', 'Shop settings are missing. Run `npm run db:seed`.')
  return row
}

export interface PublicSettingsDto {
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
  announcement: string
  instagramUrl: string
  facebookUrl: string
  tiktokUrl: string
  deliveryZones: { id: string; district: string; fee: number; sameDay: boolean; active: boolean }[]
  /** Promo codes are never public. Kept as an empty list so the shape matches the frontend type. */
  promoCodes: []
}

/** What any visitor may know. Only active delivery zones, and no promo codes. */
export async function getPublicSettings(): Promise<PublicSettingsDto> {
  const [row, zones] = await Promise.all([
    getSettingsRow(),
    prisma.deliveryZone.findMany({ where: { active: true }, orderBy: { district: 'asc' } }),
  ])
  return {
    shopName: row.shopName,
    tagline: row.tagline,
    whatsappNumber: row.whatsappNumber,
    phone: row.phone,
    email: row.email,
    address: row.address,
    openingHours: row.openingHours,
    sameDayCutoff: row.sameDayCutoff,
    acceptingOrders: row.acceptingOrders,
    freeDeliveryOver: row.freeDeliveryOver,
    announcement: row.announcement,
    instagramUrl: row.instagramUrl,
    facebookUrl: row.facebookUrl,
    tiktokUrl: row.tiktokUrl,
    deliveryZones: zones.map((z) => ({ id: z.id, district: z.district, fee: z.fee, sameDay: z.sameDay, active: z.active })),
    promoCodes: [],
  }
}
