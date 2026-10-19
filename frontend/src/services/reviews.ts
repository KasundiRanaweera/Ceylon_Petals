import type { PublicReviews, Review } from '../types'
import { del, get, patch, post } from '../lib/api'

// Customer reviews: the website reads the published ones; the owner manages all of them.

export type ReviewInput = Pick<Review, 'name' | 'location' | 'rating' | 'message' | 'orderedItem' | 'isPublished' | 'sortOrder'>

/** Published reviews, in the owner's order, with the average rating. */
export function getReviews(): Promise<PublicReviews> {
  return get<PublicReviews>('/reviews')
}

/** Owner only: published and hidden reviews. */
export function adminListReviews(): Promise<Review[]> {
  return get<Review[]>('/admin/reviews')
}

/** Owner only: adds a review, or saves changes to one that has an id. */
export function saveReview(input: ReviewInput & { id?: string }): Promise<Review> {
  const { id, ...body } = input
  return id ? patch<Review>(`/admin/reviews/${id}`, body) : post<Review>('/admin/reviews', body)
}

/** Owner only. */
export function deleteReview(id: string): Promise<void> {
  return del(`/admin/reviews/${id}`)
}
