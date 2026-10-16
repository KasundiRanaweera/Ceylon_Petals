import { Router } from 'express'
import { z } from 'zod'
import { dateSchema } from '../../lib/validation.js'
import {
  OWNER_PAYMENT_STATUSES,
  OWNER_STATUSES,
  adminGetOrder,
  adminListOrders,
  changeOrderStatus,
  changePaymentStatus,
} from '../../services/adminOrders.js'

export const adminOrdersRouter = Router()

const listQuery = z.object({
  since: dateSchema.optional(),
  limit: z.coerce.number().int().min(1).max(5000).default(1000),
})
const idParam = z.object({ id: z.string().trim().min(1).max(20) })
const statusBody = z.object({ status: z.enum(OWNER_STATUSES, { error: 'Please choose a valid order status' }) })
const paymentBody = z.object({ paymentStatus: z.enum(OWNER_PAYMENT_STATUSES, { error: 'Please choose a valid payment status' }) })

// GET /api/admin/orders?since=2026-10-01&limit=500   (newest first)
adminOrdersRouter.get('/', async (req, res) => {
  res.json(await adminListOrders(listQuery.parse(req.query)))
})

// GET /api/admin/orders/1049
adminOrdersRouter.get('/:id', async (req, res) => {
  res.json(await adminGetOrder(idParam.parse(req.params).id))
})

// PATCH /api/admin/orders/1049/status  { status }
adminOrdersRouter.patch('/:id/status', async (req, res) => {
  res.json(await changeOrderStatus(idParam.parse(req.params).id, statusBody.parse(req.body).status))
})

// PATCH /api/admin/orders/1049/payment  { paymentStatus }
adminOrdersRouter.patch('/:id/payment', async (req, res) => {
  res.json(await changePaymentStatus(idParam.parse(req.params).id, paymentBody.parse(req.body).paymentStatus))
})
