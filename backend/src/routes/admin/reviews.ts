import { Router } from 'express'
import { z } from 'zod'
import { idParams, textSchema } from '../../lib/validation.js'
import { adminListReviews, createReview, deleteReview, updateReview } from '../../services/reviews.js'

// Customer reviews: list, add, edit (including hide/show and order), delete.
export const adminReviewsRouter = Router()

const reviewBody = z.object({
  name: textSchema("the customer's name", 80),
  location: z.string().trim().max(80).default(''),
  rating: z.number().int().min(1, 'Choose 1 to 5 stars').max(5, 'Choose 1 to 5 stars'),
  message: textSchema('the review', 600),
  orderedItem: z.string().trim().max(120).default(''),
  isPublished: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(9999).default(0),
})

// GET /api/admin/reviews   (published and hidden)
adminReviewsRouter.get('/', async (_req, res) => {
  res.json(await adminListReviews())
})

// POST /api/admin/reviews
adminReviewsRouter.post('/', async (req, res) => {
  res.status(201).json(await createReview(reviewBody.parse(req.body)))
})

// PATCH /api/admin/reviews/:id   Send only what changed.
adminReviewsRouter.patch('/:id', async (req, res) => {
  res.json(await updateReview(idParams.parse(req.params).id, reviewBody.partial().parse(req.body)))
})

// DELETE /api/admin/reviews/:id
adminReviewsRouter.delete('/:id', async (req, res) => {
  await deleteReview(idParams.parse(req.params).id)
  res.status(204).end()
})
