import { Router } from 'express'
import { z } from 'zod'
import { setSessionCookie } from '../lib/cookies.js'
import { DISTRICTS } from '../lib/districts.js'
import { idParams, passwordSchema, phoneSchema, textSchema } from '../lib/validation.js'
import { requireAuth } from '../middleware/auth.js'
import { passwordChangeLimiter } from '../middleware/rateLimit.js'
import { changePassword, createAddress, deleteAddress, listAddresses, updateAddress, updateProfile } from '../services/account.js'

// Everything under /api/me needs a signed-in user.
export const accountRouter = Router()
accountRouter.use(requireAuth)

const profileBody = z.object({
  name: textSchema('your name', 100),
  phone: phoneSchema,
})

const passwordBody = z.object({
  currentPassword: z.string().min(1, 'Please enter your current password').max(200),
  newPassword: passwordSchema,
})

const addressBody = z.object({
  // Optional in the form; an empty label becomes "Address".
  label: z
    .string()
    .trim()
    .max(50)
    .optional()
    .transform((v) => v || 'Address'),
  recipientName: textSchema("the recipient's name", 100),
  phone: phoneSchema,
  line1: textSchema('the street address', 200),
  city: textSchema('the city or area', 100),
  district: z.enum(DISTRICTS, { error: 'Please choose a district' }),
  isDefault: z.boolean().optional().default(false),
})

// PATCH /api/me  { name, phone }  ->  user
accountRouter.patch('/', async (req, res) => {
  res.json(await updateProfile(req.user!.id, profileBody.parse(req.body)))
})

// POST /api/me/password  { currentPassword, newPassword }  ->  user. Other devices are signed out.
accountRouter.post('/password', passwordChangeLimiter, async (req, res) => {
  const { currentPassword, newPassword } = passwordBody.parse(req.body)
  const { user, token } = await changePassword(req.user!.id, currentPassword, newPassword)
  setSessionCookie(res, token)
  res.json(user)
})

// GET /api/me/addresses
accountRouter.get('/addresses', async (req, res) => {
  res.json(await listAddresses(req.user!.id))
})

// POST /api/me/addresses  ->  201 + address
accountRouter.post('/addresses', async (req, res) => {
  res.status(201).json(await createAddress(req.user!.id, addressBody.parse(req.body)))
})

// PUT /api/me/addresses/:id
accountRouter.put('/addresses/:id', async (req, res) => {
  const { id } = idParams.parse(req.params)
  res.json(await updateAddress(req.user!.id, id, addressBody.parse(req.body)))
})

// DELETE /api/me/addresses/:id  ->  204
accountRouter.delete('/addresses/:id', async (req, res) => {
  const { id } = idParams.parse(req.params)
  await deleteAddress(req.user!.id, id)
  res.status(204).end()
})
