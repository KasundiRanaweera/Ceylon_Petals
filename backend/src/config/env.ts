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

export const env = {
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === 'production',
  isTest: parsed.data.NODE_ENV === 'test',
  corsOrigins: parsed.data.FRONTEND_URL.split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean),
}
