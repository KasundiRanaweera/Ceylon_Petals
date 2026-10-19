import { Prisma } from '../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'
import { notFound } from '../lib/errors.js'

// Customer reviews shown on the home page. The owner adds, edits, hides and orders them in the
// admin; the website shows only the published ones, in the owner's order.

/** Matches frontend/src/types/index.ts (Review). */
export interface ReviewDto {
  id: string
  name: string
  location: string
  rating: number
  message: string
  orderedItem: string
  initials: string
  isPublished: boolean
  sortOrder: number
  createdAt: string
}

/** What the website shows: the published reviews and their average rating. */
export interface PublicReviewsDto {
  reviews: ReviewDto[]
  average: number
  count: number
}

export interface ReviewInput {
  name: string
  location: string
  rating: number
  message: string
  orderedItem: string
  isPublished: boolean
  sortOrder: number
}

type ReviewRow = Prisma.ReviewGetPayload<object>

/** "Dilshan Karunaratne" -> "DK", "Ananya" -> "A". */
export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}

function toReviewDto(r: ReviewRow): ReviewDto {
  return {
    id: r.id,
    name: r.name,
    location: r.location,
    rating: r.rating,
    message: r.message,
    orderedItem: r.orderedItem,
    initials: initialsOf(r.name),
    isPublished: r.isPublished,
    sortOrder: r.sortOrder,
    createdAt: r.createdAt.toISOString(),
  }
}

const ordering: Prisma.ReviewOrderByWithRelationInput[] = [{ sortOrder: 'asc' }, { createdAt: 'asc' }]

export async function listPublishedReviews(): Promise<PublicReviewsDto> {
  const rows = await prisma.review.findMany({ where: { isPublished: true }, orderBy: ordering })
  const total = rows.reduce((sum, r) => sum + r.rating, 0)
  return {
    reviews: rows.map(toReviewDto),
    average: rows.length ? Math.round((total / rows.length) * 10) / 10 : 0,
    count: rows.length,
  }
}

export async function adminListReviews(): Promise<ReviewDto[]> {
  return (await prisma.review.findMany({ orderBy: ordering })).map(toReviewDto)
}

export async function createReview(input: ReviewInput): Promise<ReviewDto> {
  return toReviewDto(await prisma.review.create({ data: input }))
}

export async function updateReview(id: string, changes: Partial<ReviewInput>): Promise<ReviewDto> {
  const exists = await prisma.review.findUnique({ where: { id }, select: { id: true } })
  if (!exists) throw notFound('Review not found')
  return toReviewDto(await prisma.review.update({ where: { id }, data: changes }))
}

export async function deleteReview(id: string): Promise<void> {
  const { count } = await prisma.review.deleteMany({ where: { id } })
  if (count === 0) throw notFound('Review not found')
}
