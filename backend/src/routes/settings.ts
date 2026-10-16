import { Router } from 'express'
import { getPublicSettings } from '../services/settings.js'

export const settingsRouter = Router()

// GET /api/settings  ->  shop name, WhatsApp number, cut-off time, active delivery zones...
// Public. It changes rarely, so browsers may keep it for a minute.
settingsRouter.get('/', async (_req, res) => {
  res.set('Cache-Control', 'public, max-age=60')
  res.json(await getPublicSettings())
})
