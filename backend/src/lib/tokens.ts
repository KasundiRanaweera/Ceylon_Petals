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
