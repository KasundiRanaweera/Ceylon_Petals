import 'dotenv/config'
import { z } from 'zod'

// Every environment variable the API reads is declared and checked here, once.
// If something is missing or malformed the server stops at startup with a clear message,
// instead of failing later in a confusing way.

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  // Pooled Supabase connection, used by the running API.
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  // Direct/session connection, used by the Prisma CLI (read in prisma.config.ts).
  DIRECT_URL: z.string().optional(),

  // Signs login cookies. Anyone who knows it can pretend to be any user, so keep it long and secret.
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN_DAYS: z.coerce.number().int().positive().default(7),
  // How slow password hashing is. Higher is safer but slower. 12 is a good default in 2026.
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
  // 'lax' works when the site and API share a domain (or the API is proxied through the
  // frontend host). Use 'none' only if they are on different domains, e.g. vercel.app + onrender.com.
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),

  // Browser origins allowed to call the API. Comma separated, e.g. "http://localhost:5173,https://shop.vercel.app".
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  // ---- Card payments (PayHere) ----
  // simulated: a fake gateway for local development, no real money and no PayHere account needed.
  // sandbox:   PayHere's test environment (needs the sandbox merchant id/secret and a public API address).
  // live:      real payments.
  // disabled:  card payment is switched off; customers use cash on delivery or WhatsApp.
  // Default: "simulated" while developing, "disabled" in production until you choose sandbox or live.
  PAYHERE_MODE: z.enum(['disabled', 'simulated', 'sandbox', 'live']).optional(),
  PAYHERE_MERCHANT_ID: z.string().optional(),
  // From PayHere -> Settings -> Domains & Credentials. Anyone who has it can fake payments.
  PAYHERE_MERCHANT_SECRET: z.string().optional(),
  // Where PayHere can reach this API from the internet, e.g. https://flower-api.onrender.com
  // (on your own PC use a tunnel such as ngrok). Used to build the payment callback address.
  PUBLIC_API_URL: z.string().optional(),
  // A card order that is not paid within this time is cancelled and its stock goes back on sale.
  PAYMENT_WINDOW_MINUTES: z.coerce.number().int().min(5).max(1440).default(30),

  // Owner account created by the seed script.
  OWNER_NAME: z.string().optional(),
  OWNER_EMAIL: z.string().optional(),
  OWNER_PASSWORD: z.string().optional(),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment configuration:')
  for (const issue of parsed.error.issues) console.error(`  - ${issue.path.join('.') || 'env'}: ${issue.message}`)
  console.error('Fix backend/.env and start the server again.')
  process.exit(1)
}

const data = parsed.data
const payhereMode = data.PAYHERE_MODE ?? (data.NODE_ENV === 'production' ? 'disabled' : 'simulated')

const problems: string[] = []
if (data.NODE_ENV === 'production' && payhereMode === 'simulated') {
  problems.push("PAYHERE_MODE cannot be 'simulated' in production, because the fake gateway would let anyone mark an order as paid. Use 'sandbox', 'live' or 'disabled'.")
}
if (payhereMode === 'sandbox' || payhereMode === 'live') {
  if (!data.PAYHERE_MERCHANT_ID) problems.push(`PAYHERE_MERCHANT_ID is required when PAYHERE_MODE is '${payhereMode}'`)
  if (!data.PAYHERE_MERCHANT_SECRET) problems.push(`PAYHERE_MERCHANT_SECRET is required when PAYHERE_MODE is '${payhereMode}'`)
  if (!data.PUBLIC_API_URL) problems.push(`PUBLIC_API_URL is required when PAYHERE_MODE is '${payhereMode}' (PayHere must be able to reach your API)`)
}
if (problems.length > 0) {
  console.error('Invalid environment configuration:')
  for (const problem of problems) console.error(`  - ${problem}`)
  console.error('Fix backend/.env and start the server again.')
  process.exit(1)
}

const corsOrigins = data.FRONTEND_URL.split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean)

export const env = {
  ...data,
  isProduction: data.NODE_ENV === 'production',
  isTest: data.NODE_ENV === 'test',
  corsOrigins,
  payhere: {
    mode: payhereMode as 'disabled' | 'simulated' | 'sandbox' | 'live',
    merchantId: data.PAYHERE_MERCHANT_ID ?? '',
    merchantSecret: data.PAYHERE_MERCHANT_SECRET ?? '',
    checkoutUrl: payhereMode === 'live' ? 'https://www.payhere.lk/pay/checkout' : 'https://sandbox.payhere.lk/pay/checkout',
    notifyUrl: `${(data.PUBLIC_API_URL ?? '').replace(/\/$/, '')}/api/payments/payhere/notify`,
    // Where PayHere sends the customer back to: the first frontend address.
    returnBase: corsOrigins[0] ?? 'http://localhost:5173',
    windowMinutes: data.PAYMENT_WINDOW_MINUTES,
  },
}
