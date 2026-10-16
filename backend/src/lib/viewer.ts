import type { Request } from 'express'
import type { Viewer } from '../services/orders.js'

/**
 * Who is asking to see an order: the signed-in user (if any) and the checkout access token
 * (X-Order-Token header, or ?token=). The service decides whether that is enough.
 */
export function viewerFrom(req: Request): Viewer {
  const queryToken = typeof req.query['token'] === 'string' ? req.query['token'] : undefined
  return { user: req.user, token: req.get('x-order-token') ?? queryToken }
}
