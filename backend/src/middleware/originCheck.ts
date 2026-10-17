import type { RequestHandler } from 'express'
import { isAllowedOrigin } from '../config/env.js'
import { forbidden } from '../lib/errors.js'

// Protection against cross-site request forgery (CSRF).
//
// The login cookie is sent automatically by the browser, so a malicious page could try to make
// a signed-in customer's browser POST to our API. Browsers always attach an Origin header to
// those requests, and it names the malicious page. So for anything that changes data we
// reject requests whose Origin is not one of our own frontends.
//
// Requests with no Origin header are not browser form posts (curl, PayHere's server-to-server
// callback), and they carry no cookie to abuse, so they pass.

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export const rejectForeignOrigins: RequestHandler = (req, _res, next) => {
  if (SAFE_METHODS.has(req.method)) return next()
  const origin = req.get('origin')
  if (origin && !isAllowedOrigin(origin)) {
    return next(forbidden('This request was blocked because it came from an unknown website'))
  }
  next()
}
