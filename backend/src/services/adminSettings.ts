import { prisma } from '../lib/prisma.js'
import { getSettingsRow } from './settings.js'

// The owner's Settings page: shop details, ordering rules, delivery zones and promo codes.

export interface ZoneDto {
  id: string
  district: string
  fee: number
  sameDay: boolean
  active: boolean
}

export interface PromoDto {
  id: string
  code: string
  type: 'PERCENT' | 'FIXED'
  value: number
  minOrder: number
  active: boolean
  description: string
}

export interface AdminSettingsDto {
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
  deliveryZones: ZoneDto[]
  promoCodes: PromoDto[]
}

export async function getAdminSettings(): Promise<AdminSettingsDto> {
  const [row, zones, promos] = await Promise.all([
    getSettingsRow(),
    prisma.deliveryZone.findMany({ orderBy: { district: 'asc' } }),
    prisma.promoCode.findMany({ orderBy: { createdAt: 'asc' } }),
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
    deliveryZones: zones.map((z) => ({ id: z.id, district: z.district, fee: z.fee, sameDay: z.sameDay, active: z.active })),
    promoCodes: promos.map((p) => ({ id: p.id, code: p.code, type: p.type, value: p.value, minOrder: p.minOrder, active: p.active, description: p.description })),
  }
}

export interface SettingsChanges {
  shopName?: string
  tagline?: string
  whatsappNumber?: string
  phone?: string
  email?: string
  address?: string
  openingHours?: string
  sameDayCutoff?: string
  acceptingOrders?: boolean
  freeDeliveryOver?: number
  /** When given, this is the complete list: zones missing from it are removed. */
  deliveryZones?: { district: string; fee: number; sameDay: boolean; active: boolean }[]
  /** When given, this is the complete list: codes missing from it are removed. */
  promoCodes?: { code: string; type: 'PERCENT' | 'FIXED'; value: number; minOrder: number; active: boolean; description: string }[]
}

/**
 * Changes only what is sent (so the "accepting orders" switch can send just that one field).
 * Lists of zones and promo codes are replaced as a whole. Everything happens or nothing does.
 */
export async function updateAdminSettings(changes: SettingsChanges): Promise<AdminSettingsDto> {
  const { deliveryZones, promoCodes, ...fields } = changes

  await prisma.$transaction(async (tx) => {
    if (Object.keys(fields).length > 0) await tx.shopSettings.update({ where: { id: 1 }, data: fields })

    if (deliveryZones) {
      for (const zone of deliveryZones) {
        await tx.deliveryZone.upsert({ where: { district: zone.district }, update: zone, create: zone })
      }
      await tx.deliveryZone.deleteMany({ where: { district: { notIn: deliveryZones.map((z) => z.district) } } })
    }

    if (promoCodes) {
      for (const promo of promoCodes) {
        await tx.promoCode.upsert({ where: { code: promo.code }, update: promo, create: promo })
      }
      await tx.promoCode.deleteMany({ where: { code: { notIn: promoCodes.map((p) => p.code) } } })
    }
  })

  return getAdminSettings()
}
