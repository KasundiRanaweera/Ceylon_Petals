import { Router } from 'express'
import { z } from 'zod'
import { createUploadSignature } from '../../lib/cloudinary.js'
import { idParams, textSchema } from '../../lib/validation.js'
import { uploadSignLimiter } from '../../middleware/rateLimit.js'
import {
  adminGetProduct,
  adminListProducts,
  createProduct,
  deleteProduct,
  setProductActive,
  setProductStock,
  updateProduct,
} from '../../services/adminProducts.js'
import { adminListCategories, createCategory, deleteCategory, updateCategory } from '../../services/adminCategories.js'

// Products, categories and photo uploads.
export const adminCatalogRouter = Router()

// ---------------------------------------------------------------- products

// A photo is either a full https:// link (Cloudinary or any image address), or one of the shop's own
// files under /images/ (the sample products ship with these). Anything else, such as data: images,
// plain http:// or other relative paths, is refused.
const SITE_PHOTO = /^\/images\/[A-Za-z0-9._/-]+$/
function isPhotoLink(value: string): boolean {
  if (value.startsWith('https://')) {
    try {
      return Boolean(new URL(value).hostname)
    } catch {
      return false
    }
  }
  return SITE_PHOTO.test(value) && !value.includes('..') && !value.includes('//')
}
const PHOTO_HINT = "Use a photo link that starts with https:// (or upload a photo instead)"

const photo = z.string().trim().max(1000).refine(isPhotoLink, PHOTO_HINT)

const shortList = (max: number, itemMax: number) => z.array(z.string().trim().min(1).max(itemMax)).max(max).default([])
const money = z
  .number('Please enter a number')
  .int('Use whole rupees')
  .min(1, 'Please enter a price above zero')
  .max(10_000_000, 'That price is too high. Please check it (the most is Rs. 10,000,000)')

const productBody = z.object({
  name: textSchema('the product name', 150),
  // The category's slug, as shown in the shop's web addresses.
  categoryId: z.string().trim().min(1, 'Please choose a category').max(100),
  shortDescription: textSchema('a short description', 200),
  description: z.string().trim().max(5000).default(''),
  price: money,
  discountPrice: money.nullable().optional(),
  stock: z.number('Please enter the stock').int().min(0, 'Stock cannot be negative').max(100_000),
  lowStockThreshold: z.number().int().min(0).max(100_000).default(5),
  badge: z.string().trim().max(30).nullable().optional(),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sameDay: z.boolean().default(true),
  occasions: shortList(20, 40),
  images: z.array(photo).min(1, 'Please add at least one photo').max(10, 'You can add up to 10 photos'),
  details: shortList(20, 200),
  flowerTypes: shortList(30, 60),
  colours: shortList(30, 40),
  tags: shortList(30, 40),
  attributes: z.record(z.string().max(60), z.string().max(200)).nullable().optional(),
})

const parseProduct = (body: unknown) => {
  const input = productBody.parse(body)
  return { ...input, description: input.description || input.shortDescription }
}

// GET /api/admin/products   (hidden ones too)
adminCatalogRouter.get('/products', async (_req, res) => {
  res.json(await adminListProducts())
})

// POST /api/admin/products  ->  201
adminCatalogRouter.post('/products', async (req, res) => {
  res.status(201).json(await createProduct(parseProduct(req.body)))
})

adminCatalogRouter.get('/products/:id', async (req, res) => {
  res.json(await adminGetProduct(idParams.parse(req.params).id))
})

// PUT /api/admin/products/:id  (the web address of the product never changes)
adminCatalogRouter.put('/products/:id', async (req, res) => {
  res.json(await updateProduct(idParams.parse(req.params).id, parseProduct(req.body)))
})

// PATCH /api/admin/products/:id/active  { isActive }   show or hide in the shop
adminCatalogRouter.patch('/products/:id/active', async (req, res) => {
  const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body)
  res.json(await setProductActive(idParams.parse(req.params).id, isActive))
})

// PATCH /api/admin/products/:id/stock  { stock }
adminCatalogRouter.patch('/products/:id/stock', async (req, res) => {
  const { stock } = z.object({ stock: z.number('Please enter the stock').int().min(0, 'Stock cannot be negative').max(100_000) }).parse(req.body)
  res.json(await setProductStock(idParams.parse(req.params).id, stock))
})

// DELETE /api/admin/products/:id  ->  204. Past orders keep their own copy of the details.
adminCatalogRouter.delete('/products/:id', async (req, res) => {
  await deleteProduct(idParams.parse(req.params).id)
  res.status(204).end()
})

// ---------------------------------------------------------------- categories

const categoryBody = z.object({
  name: textSchema('the category name', 80),
  description: z.string().trim().max(500).default(''),
  imageUrl: z
    .string()
    .trim()
    .max(1000)
    .refine((u) => u === '' || isPhotoLink(u), PHOTO_HINT)
    .default(''),
  sortOrder: z.number().int().min(0).max(1000).default(0),
  isActive: z.boolean().default(true),
})
const slugParam = z.object({ id: z.string().trim().min(1).max(100) })

// GET /api/admin/categories   (with productCount, hidden categories too)
adminCatalogRouter.get('/categories', async (_req, res) => {
  res.json(await adminListCategories())
})

adminCatalogRouter.post('/categories', async (req, res) => {
  res.status(201).json(await createCategory(categoryBody.parse(req.body)))
})

// The :id of a category is its slug.
adminCatalogRouter.put('/categories/:id', async (req, res) => {
  res.json(await updateCategory(slugParam.parse(req.params).id, categoryBody.parse(req.body)))
})

adminCatalogRouter.delete('/categories/:id', async (req, res) => {
  await deleteCategory(slugParam.parse(req.params).id)
  res.status(204).end()
})

// ---------------------------------------------------------------- photo uploads

// POST /api/admin/uploads/sign  ->  { uploadUrl, params }
// The browser sends the photo straight to Cloudinary with these values, then saves the
// returned "secure_url" on the product. 503 if Cloudinary is not set up.
adminCatalogRouter.post('/uploads/sign', uploadSignLimiter, (_req, res) => {
  res.json(createUploadSignature())
})
