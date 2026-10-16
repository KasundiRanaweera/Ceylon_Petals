import { Router } from 'express'
import { z } from 'zod'
import { clearSessionCookie, setSessionCookie } from '../lib/cookies.js'
import { emailSchema, passwordSchema, phoneSchema, textSchema } from '../lib/validation.js'
import { requireAuth } from '../middleware/auth.js'
import { noStore } from '../middleware/noStore.js'
import { loginLimiter, registerLimiter } from '../middleware/rateLimit.js'
import { loginWithPassword, registerCustomer, revokeAllSessions } from '../services/auth.js'

export const authRouter = Router()
authRouter.use(noStore)

// Unknown fields (for example "role": "OWNER") are dropped by Zod and never reach the service.
const registerBody = z.object({
  name: textSchema('your name', 100),
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
})

// Sign-in only checks that something was typed. The rules for a good password apply when it is created.
const loginBody = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Please enter your password').max(200),
})

// POST /api/auth/register  { name, email, phone, password }  ->  201 + user + login cookie
authRouter.post('/register', registerLimiter, async (req, res) => {
  const { user, token } = await registerCustomer(registerBody.parse(req.body))
  setSessionCookie(res, token)
  res.status(201).json(user)
})

// POST /api/auth/login  { email, password }  ->  user + login cookie
authRouter.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = loginBody.parse(req.body)
  const { user, token } = await loginWithPassword(email, password)
  setSessionCookie(res, token)
  res.json(user)
})

// POST /api/auth/logout  ->  204. Clears this browser's cookie.
authRouter.post('/logout', (_req, res) => {
  clearSessionCookie(res)
  res.status(204).end()
})

// POST /api/auth/logout-all  ->  204. Signs the account out on every device.
authRouter.post('/logout-all', requireAuth, async (req, res) => {
  await revokeAllSessions(req.user!.id)
  clearSessionCookie(res)
  res.status(204).end()
})

// GET /api/auth/me  ->  the signed-in user, or null for a guest (always 200, so a guest
// visiting the site does not produce errors in the browser console).
authRouter.get('/me', (req, res) => {
  res.json(req.user ?? null)
})
