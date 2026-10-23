import type { Request, RequestHandler } from 'express'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import { env } from '../config/env.js'
import { tooManyRequests } from '../lib/errors.js'

// Slows down password guessing and fake sign-ups. Counters live in memory, which is fine for a
// single server instance. If the API ever runs on several instances, give these a shared store.

const handler: RequestHandler = (_req, _res, next) => next(tooManyRequests())

const common = { standardHeaders: 'draft-8', legacyHeaders: false, handler } as const

const ipOf = (req: Request) => ipKeyGenerator(req.ip ?? '')

/**
 * Only ever true when NODE_ENV is "test": the automated tests place many orders from one address,
 * so these limits are off for them unless a test sends "x-test-limit" to check the limit itself.
 * In production, development and every other environment this is always false.
 */
const skipInTests = (req: Request) => env.isTest && !req.get('x-test-limit')

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

/**
 * Password reset links: 10 failed tries per 15 minutes per address. The links are far too long to
 * guess, so this only stops someone hammering the endpoint.
 */
export const passwordResetLimiter = rateLimit({
  ...common,
  skip: skipInTests,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  keyGenerator: ipOf,
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

/** Placing orders: 20 per hour per address. Stops someone flooding the shop with fake orders. */
export const orderLimiter = rateLimit({
  ...common,
  skip: skipInTests,
  windowMs: 60 * 60 * 1000,
  limit: 20,
  keyGenerator: ipOf,
})

/**
 * Order tracking: 15 wrong lookups per 15 minutes per address. Order numbers are sequential, so
 * without this someone could try many numbers with guessed phone numbers.
 */
export const trackLimiter = rateLimit({
  ...common,
  skip: skipInTests,
  windowMs: 15 * 60 * 1000,
  limit: 15,
  skipSuccessfulRequests: true,
  keyGenerator: ipOf,
})

/** The checkout summary is recalculated whenever the form changes, so allow plenty. */
export const quoteLimiter = rateLimit({
  ...common,
  skip: skipInTests,
  windowMs: 5 * 60 * 1000,
  limit: 150,
  keyGenerator: ipOf,
})

/** Starting a card payment: 30 per 15 minutes per address. */
export const paymentLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 30,
  skip: skipInTests,
  keyGenerator: ipOf,
})

/** Custom order requests: 10 per hour per address, so the owner's inbox cannot be flooded. */
export const inquiryLimiter = rateLimit({
  ...common,
  windowMs: 60 * 60 * 1000,
  limit: 10,
  skip: skipInTests,
  keyGenerator: ipOf,
})

/** Photo upload signatures (owner only). */
export const uploadSignLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 100,
  skip: skipInTests,
  keyGenerator: (req) => req.user?.id ?? ipOf(req),
})

/** Chatbot messages: 30 per 10 minutes per address. Each one costs an AI call, so this also caps the bill. */
export const chatLimiter = rateLimit({
  ...common,
  windowMs: 10 * 60 * 1000,
  limit: 30,
  skip: skipInTests,
  keyGenerator: ipOf,
})
