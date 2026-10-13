import type { CookieOptions, Response } from 'express'
import { env } from '../config/env.js'

// The browser keeps the login token in an httpOnly cookie, so JavaScript on the page (and
// therefore any injected script) can never read it.

export const SESSION_COOKIE = 'cp_session'

const options: CookieOptions = {
  httpOnly: true,
  // Only sent over HTTPS in production. (SameSite=None requires Secure.)
  secure: env.isProduction,
  sameSite: env.COOKIE_SAME_SITE,
  path: '/',
}

export function setSessionCookie(res: Response, token: string) {
  res.cookie(SESSION_COOKIE, token, { ...options, maxAge: env.JWT_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000 })
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, options)
}
