import type { Request, RequestHandler } from 'express'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import { tooManyRequests } from '../lib/errors.js'

// Slows down password guessing and fake sign-ups. Counters live in memory, which is fine for a
// single server instance. If the API ever runs on several instances, give these a shared store.

const handler: RequestHandler = (_req, _res, next) => next(tooManyRequests())

const common = { standardHeaders: 'draft-8', legacyHeaders: false, handler } as const

const ipOf = (req: Request) => ipKeyGenerator(req.ip ?? '')

/**
 * Failed sign-ins: 10 per 15 minutes for the same email from the same address.
 * Successful sign-ins are not counted, so a real customer is never locked out by their own logins.
 */
export const loginLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `${ipOf(req)}|${String((req.body as { email?: unknown } | undefined)?.email ?? '').toLowerCase().slice(0, 100)}`,
})

/** New accounts: 10 per hour per address. */
export const registerLimiter = rateLimit({
  ...common,
  windowMs: 60 * 60 * 1000,
  limit: 10,
  keyGenerator: ipOf,
})

/**
 * Password changes: 5 wrong attempts per 15 minutes per account. Without this, someone using a
 * borrowed, still-signed-in browser could guess the current password.
 */
export const passwordChangeLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => req.user?.id ?? ipOf(req),
})
