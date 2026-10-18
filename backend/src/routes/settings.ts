import { Router } from 'express'
import { getPublicSettings } from '../services/settings.js'

export const settingsRouter = Router()

// GET /api/settings  ->  shop name, WhatsApp number, cut-off time, active delivery zones...
// Public. Browsers must check with us each time (a quick "not modified" when nothing changed), so a
// change the owner saves in Settings (phone, announcement, opening hours...) shows on the next page load.
settingsRouter.get('/', async (_req, res) => {
  res.set('Cache-Control', 'no-cache')
  res.json(await getPublicSettings())
})
