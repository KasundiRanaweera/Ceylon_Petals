import { useQuery } from '@tanstack/react-query'
import { getReviews } from '../services/reviews'

/** The published customer reviews and their average rating, shared by every part of the page that shows them. */
export function useReviews() {
  return useQuery({ queryKey: ['reviews'], queryFn: getReviews, staleTime: 5 * 60_000 })
}
