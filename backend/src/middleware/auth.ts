import type { RequestHandler } from 'express'
import { SESSION_COOKIE, clearSessionCookie } from '../lib/cookies.js'
import { forbidden, unauthorized } from '../lib/errors.js'
import { userFromToken, type UserDto } from '../services/auth.js'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Set by `authenticate` when the request has a valid login cookie. */
      user?: UserDto
    }
  }
}

/**
 * Runs on every request. If there is a valid login cookie it sets `req.user`; if not it simply
 * carries on (guests are allowed almost everywhere). Use requireAuth / requireOwner to protect routes.
 */
export const authenticate: RequestHandler = async (req, res, next) => {
  const token = req.cookies?.[SESSION_COOKIE] as string | undefined
  if (!token) return next()
  const user = await userFromToken(token)
  if (user) req.user = user
  else clearSessionCookie(res) // stale or revoked cookie: remove it
  next()
}

/** Any signed-in user (customer or owner). */
export const requireAuth: RequestHandler = (req, _res, next) => {
  if (!req.user) return next(unauthorized())
  next()
}

/** Owner only. A signed-in customer gets 403, a guest gets 401. */
export const requireOwner: RequestHandler = (req, _res, next) => {
  if (!req.user) return next(unauthorized())
  if (req.user.role !== 'OWNER') return next(forbidden('Only the shop owner can do that'))
  next()
}
