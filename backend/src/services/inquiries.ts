import { Prisma } from '../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'
import { dateOnly } from '../lib/colomboTime.js'
import { notFound } from '../lib/errors.js'

// Custom requests from the website: weddings, bulk orders, corporate gifting, custom designs.
// Customers send them (no account needed); the owner reads and answers them in the admin.

export type InquiryType = 'WEDDING' | 'BULK' | 'CORPORATE' | 'CUSTOM'
export type InquiryStatus = 'NEW' | 'CONTACTED' | 'QUOTED' | 'CONFIRMED' | 'CLOSED'

/** Matches frontend/src/types/index.ts (Inquiry). */
export interface InquiryDto {
  id: string
  reference: string
  type: InquiryType
  name: string
  email: string
  phone: string
  eventDate?: string
  location?: string
  budget?: string
  quantity?: string
  details: string
  extra?: Record<string, string>
  status: InquiryStatus
  ownerNotes?: string
  createdAt: string
}

type InquiryRow = Prisma.InquiryGetPayload<object>

function toInquiryDto(i: InquiryRow): InquiryDto {
  return {
    id: i.id,
    reference: `INQ-${i.number}`,
    type: i.type,
    name: i.name,
    email: i.email,
    phone: i.phone,
    ...(i.eventDate ? { eventDate: i.eventDate.toISOString().slice(0, 10) } : {}),
    ...(i.location ? { location: i.location } : {}),
    ...(i.budget ? { budget: i.budget } : {}),
    ...(i.quantity ? { quantity: i.quantity } : {}),
    details: i.details,
    ...(i.extra && typeof i.extra === 'object' ? { extra: i.extra as Record<string, string> } : {}),
    status: i.status,
    ...(i.ownerNotes ? { ownerNotes: i.ownerNotes } : {}),
    createdAt: i.createdAt.toISOString(),
  }
}

export interface InquiryInput {
  type: InquiryType
  name: string
  email: string
  phone: string
  eventDate?: string | undefined
  location?: string | undefined
  budget?: string | undefined
  quantity?: string | undefined
  details: string
  extra?: Record<string, string> | undefined
}

export async function createInquiry(input: InquiryInput): Promise<InquiryDto> {
  const row = await prisma.inquiry.create({
    data: {
      type: input.type,
      name: input.name,
      email: input.email,
      phone: input.phone,
      eventDate: input.eventDate ? dateOnly(input.eventDate) : null,
      location: input.location ?? null,
      budget: input.budget ?? null,
      quantity: input.quantity ?? null,
      details: input.details,
      extra: input.extra && Object.keys(input.extra).length > 0 ? input.extra : Prisma.JsonNull,
    },
  })
  return toInquiryDto(row)
}

export async function adminListInquiries(): Promise<InquiryDto[]> {
  const rows = await prisma.inquiry.findMany({ orderBy: { createdAt: 'desc' }, take: 500 })
  return rows.map(toInquiryDto)
}

export async function updateInquiry(id: string, changes: { status?: InquiryStatus | undefined; ownerNotes?: string | undefined }): Promise<InquiryDto> {
  try {
    const row = await prisma.inquiry.update({
      where: { id },
      data: {
        ...(changes.status ? { status: changes.status } : {}),
        ...(changes.ownerNotes !== undefined ? { ownerNotes: changes.ownerNotes || null } : {}),
      },
    })
    return toInquiryDto(row)
  } catch (error) {
    if ((error as { code?: string }).code === 'P2025') throw notFound('Inquiry not found')
    throw error
  }
}
