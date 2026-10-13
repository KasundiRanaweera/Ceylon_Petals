import { Router } from 'express'
import { z } from 'zod'
import { getProductBySlug, listCategories, listOccasions, listProducts } from '../services/catalog.js'

// Public, read-only catalogue endpoints. No sign-in needed.
export const catalogRouter = Router()

const flag = z.enum(['true', 'false', '1', '0']).transform((v) => v === 'true' || v === '1')

const productsQuery = z.object({
  // The frontend sends `categoryId` (a category slug); `category` means the same thing.
  categoryId: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  occasion: z.string().trim().min(1).optional(),
  tag: z.string().trim().min(1).optional(),
  q: z.string().trim().max(100).optional(),
  featured: flag.optional(),
  inStock: flag.optional(),
  sort: z.enum(['featured', 'price-asc', 'price-desc', 'newest']).default('featured'),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})

// GET /api/products?category=roses&occasion=anniversary&q=lily&featured=true&sort=price-asc
catalogRouter.get('/products', async (req, res) => {
  const { categoryId, category, ...rest } = productsQuery.parse(req.query)
  res.json(await listProducts({ ...rest, category: category ?? categoryId }))
})

// GET /api/products/nuwara-eliya-crimson-empress
catalogRouter.get('/products/:slug', async (req, res) => {
  res.json(await getProductBySlug(z.string().min(1).parse(req.params.slug)))
})

// GET /api/categories
catalogRouter.get('/categories', async (_req, res) => {
  res.json(await listCategories())
})

// GET /api/occasions
catalogRouter.get('/occasions', async (_req, res) => {
  res.json(await listOccasions())
})
