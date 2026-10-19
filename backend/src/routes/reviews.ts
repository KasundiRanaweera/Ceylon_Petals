import { Router } from 'express'
import { listPublishedReviews } from '../services/reviews.js'

export const reviewsRouter = Router()

// GET /api/reviews  ->  { reviews, average, count }   (published reviews only, in the owner's order)
reviewsRouter.get('/', async (_req, res) => {
  res.set('Cache-Control', 'no-cache')
  res.json(await listPublishedReviews())
})
