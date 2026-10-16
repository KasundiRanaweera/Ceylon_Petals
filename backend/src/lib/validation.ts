import { z } from 'zod'
import { isValidPhone, normalizePhone } from './phone.js'

// Small building blocks for request schemas. Use them in every route so the same field is
// validated the same way everywhere, e.g.:
//
//   const body = z.object({ email: emailSchema, phone: phoneSchema }).parse(req.body)

/** Trimmed, lower-cased, valid email. */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Enter a valid email address'))

/** Accepts "077 123 4567" or "+44 7700 900123" and returns digits only. */
export const phoneSchema = z
  .string()
  .trim()
  .refine(isValidPhone, 'Enter a valid phone number')
  .transform(normalizePhone)

export const passwordSchema = z
  .string()
  .min(8, 'Your password needs at least 8 characters')
  .max(72, 'Your password is too long') // bcrypt only uses the first 72 bytes

/** Non-empty trimmed text with a sensible upper limit. */
export const textSchema = (label: string, max = 200) =>
  z.string().trim().min(1, `Please enter ${label}`).max(max, `${label} is too long`)

/** YYYY-MM-DD, as sent by <input type="date">. */
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the date format YYYY-MM-DD')

export const uuidSchema = z.uuid('Invalid id')
export const idParams = z.object({ id: uuidSchema })

/** ?page=2&pageSize=20 */
export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

/** An empty form field ("" or just spaces) means "not given". */
export const blankToUndefined = (value: unknown) => (typeof value === 'string' && value.trim() === '' ? undefined : value)

/** Optional text that may be sent as an empty string. */
export const optionalText = (max: number) => z.preprocess(blankToUndefined, z.string().trim().max(max).optional())
