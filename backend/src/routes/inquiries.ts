import { Router } from 'express'
import { z } from 'zod'
import { blankToUndefined, dateSchema, emailSchema, optionalText, phoneSchema, textSchema } from '../lib/validation.js'
import { inquiryLimiter } from '../middleware/rateLimit.js'
import { createInquiry } from '../services/inquiries.js'

// Custom order requests from the website (weddings, bulk orders, corporate gifts, custom designs).
export const inquiriesRouter = Router()

const body = z.object({
  type: z.enum(['WEDDING', 'BULK', 'CORPORATE', 'CUSTOM'], { error: 'Please choose what you need' }),
  name: textSchema('your name', 100),
  email: emailSchema,
  phone: phoneSchema,
  eventDate: z.preprocess(blankToUndefined, dateSchema.optional()),
  location: optionalText(150),
  budget: optionalText(60),
  quantity: optionalText(100),
  details: textSchema('what you need', 3000),
  // Other answers from the form (e.g. the wedding "ceremony format"), shown to the owner as label/value pairs.
  extra: z
    .record(z.string().max(50), z.string().max(300))
    .refine((x) => Object.keys(x).length <= 15, 'Too many extra answers')
    .optional(),
})

// POST /api/inquiries  ->  201 + the saved request (with its INQ-xxx reference)
inquiriesRouter.post('/', inquiryLimiter, async (req, res) => {
  res.status(201).json(await createInquiry(body.parse(req.body)))
})
