import type { RequestHandler } from 'express'

// Responses that contain personal data (accounts, orders, addresses) must never be kept by the
// browser cache or a shared proxy, so the next person on a shared computer cannot see them.
export const noStore: RequestHandler = (_req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
}
