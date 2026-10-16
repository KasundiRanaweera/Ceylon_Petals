import { Router } from 'express'
import { z } from 'zod'
import { env } from '../config/env.js'
import { notFound } from '../lib/errors.js'
import { viewerFrom } from '../lib/viewer.js'
import { noStore } from '../middleware/noStore.js'
import { paymentLimiter } from '../middleware/rateLimit.js'
import { handlePayhereNotification, simulatePayment, startCardPayment, type NotifyFields } from '../services/payments.js'

export const paymentsRouter = Router()
paymentsRouter.use(noStore)

const orderBody = z.object({ orderNumber: z.string().trim().min(1).max(20) })
const simulateBody = orderBody.extend({ outcome: z.enum(['success', 'failed', 'cancelled']) })

// POST /api/payments/payhere/start  { orderNumber }
//   -> { mode: 'simulated' }                                    (local development)
//   -> { mode, action, method: 'POST', fields: {...signed...} }  the browser posts these to PayHere
// Needs the same access to the order as viewing it (owner, the customer, or the checkout token).
paymentsRouter.post('/payhere/start', paymentLimiter, async (req, res) => {
  const { orderNumber } = orderBody.parse(req.body)
  res.json(await startCardPayment(orderNumber, viewerFrom(req)))
})

// POST /api/payments/payhere/notify
// Called by PayHere's own servers (form-encoded). The signature is the only authentication.
paymentsRouter.post('/payhere/notify', async (req, res) => {
  if (env.payhere.mode !== 'sandbox' && env.payhere.mode !== 'live') throw notFound('Not found')
  await handlePayhereNotification(req.body as NotifyFields)
  res.status(200).type('text/plain').send('OK')
})

// POST /api/payments/dev/simulate  { orderNumber, outcome }
// Only exists while PAYHERE_MODE=simulated. In any other mode it answers 404.
paymentsRouter.post('/dev/simulate', async (req, res) => {
  if (env.payhere.mode !== 'simulated') throw notFound('Not found')
  const { orderNumber, outcome } = simulateBody.parse(req.body)
  res.json(await simulatePayment(orderNumber, viewerFrom(req), outcome))
})
