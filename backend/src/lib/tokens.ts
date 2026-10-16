import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

// The login token kept in the browser cookie. It only says WHO (the user id) and which
// "token version" the user had. Everything else, like the role, is read fresh from the database
// on each request, so demoting an account or signing everyone out takes effect immediately.

export interface VerifiedToken {
  userId: string
  tokenVersion: number
}

export function signAuthToken(user: { id: string; tokenVersion: number }): string {
  return jwt.sign({ tv: user.tokenVersion }, env.JWT_SECRET, {
    algorithm: 'HS256',
    subject: user.id,
    expiresIn: env.JWT_EXPIRES_IN_DAYS * 24 * 60 * 60,
  })
}

/** Returns null for anything wrong: bad signature, expired, wrong algorithm, malformed. */
export function verifyAuthToken(token: string): VerifiedToken | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] })
    if (typeof payload === 'string' || !payload.sub || typeof payload['tv'] !== 'number') return null
    return { userId: payload.sub, tokenVersion: payload['tv'] }
  } catch {
    return null
  }
}

// ---------------------------------------------------------------- order view tokens

// A guest has no account, but right after checkout they must be able to see their order
// confirmation. Order numbers are sequential (CP-1050, CP-1051 ...), so the number alone must
// never be enough to read an order. Checkout therefore returns a signed token that only the
// person who placed the order has. It works for 24 hours and only for that one order.

const ORDER_TOKEN_HOURS = 24

export function signOrderToken(orderNumber: number): string {
  return jwt.sign({ purpose: 'order-view', n: orderNumber }, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: ORDER_TOKEN_HOURS * 60 * 60,
  })
}

export function verifyOrderToken(token: string, orderNumber: number): boolean {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] })
    return typeof payload !== 'string' && payload['purpose'] === 'order-view' && payload['n'] === orderNumber
  } catch {
    return false
  }
}
