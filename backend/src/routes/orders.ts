import { Router } from 'express'
import { z } from 'zod'
import { DISTRICTS } from '../lib/districts.js'
import { SLOT_KEYS } from '../lib/deliverySlots.js'
import { blankToUndefined, dateSchema, emailSchema, optionalText, phoneSchema, textSchema, uuidSchema } from '../lib/validation.js'
import { viewerFrom } from '../lib/viewer.js'
import { noStore } from '../middleware/noStore.js'
import { orderLimiter, quoteLimiter, trackLimiter } from '../middleware/rateLimit.js'
import { createOrder, getOrderForViewer, quoteOrder, trackOrder } from '../services/orders.js'

export const ordersRouter = Router()
ordersRouter.use(noStore)

// A cart line says WHAT and HOW MANY. It never carries a price: the server looks that up.
// Unknown fields (like a "price" some script tries to add) are dropped by Zod.
const cartLine = z.union([
  z.object({ productId: uuidSchema, quantity: z.number().int().min(1).max(20) }),
  z.object({
    hamper: z.object({
      base: z.string().min(1).max(40),
      treats: z.array(z.string().max(40)).max(10).default([]),
      keepsake: z.string().max(40).nullable().optional(),
    }),
    quantity: z.number().int().min(1).max(10),
  }),
])
const items = z.array(cartLine).min(1, 'Your cart is empty.').max(30, 'Your cart has too many items.')

// "" (an empty form field) means "not given".
const optionalSlot = z.preprocess(blankToUndefined, z.enum(SLOT_KEYS).optional())

const quoteBody = z.object({
  items,
  district: optionalText(60),
  deliverySlot: optionalSlot,
  promoCode: optionalText(40),
})

const checkoutBody = z.object({
  items,
  customerName: textSchema('your name', 100),
  customerPhone: phoneSchema,
  customerEmail: z.preprocess(blankToUndefined, emailSchema.optional()),
  recipientName: textSchema("the recipient's name", 100),
  recipientPhone: phoneSchema,
  address: textSchema('the street address', 200),
  area: textSchema('the city or area', 100),
  district: z.enum(DISTRICTS, { error: 'Please choose a district' }),
  deliveryDate: dateSchema,
  deliverySlot: z.enum(SLOT_KEYS, { error: 'Please choose a delivery time' }),
  cardMessage: optionalText(250),
  deliveryNotes: optionalText(500),
  promoCode: optionalText(40),
  paymentMethod: z.enum(['CARD', 'CASH_ON_DELIVERY', 'WHATSAPP']),
})

const trackBody = z.object({
  orderNumber: z.string().trim().min(1, 'Please enter your order number').max(20),
  phone: z.string().trim().min(1, 'Please enter the phone number used for the order').max(30),
})

// POST /api/orders/quote  ->  { subtotal, deliveryFee, discount, total, promoError? }
ordersRouter.post('/quote', quoteLimiter, async (req, res) => {
  res.json(await quoteOrder(quoteBody.parse(req.body)))
})

// POST /api/orders  ->  201 + the order + an accessToken for viewing it as a guest
ordersRouter.post('/', orderLimiter, async (req, res) => {
  const { order, accessToken } = await createOrder(checkoutBody.parse(req.body), req.user)
  res.status(201).json({ ...order, accessToken })
})

// POST /api/orders/track  { orderNumber, phone }  ->  the order
ordersRouter.post('/track', trackLimiter, async (req, res) => {
  const { orderNumber, phone } = trackBody.parse(req.body)
  res.json(await trackOrder(orderNumber, phone))
})

// GET /api/orders/CP-1049   (owner, the customer who placed it, or the holder of the checkout token)
// The token comes in the X-Order-Token header (or ?token=).
ordersRouter.get('/:orderNumber', async (req, res) => {
  res.json(await getOrderForViewer(req.params.orderNumber, viewerFrom(req)))
})
