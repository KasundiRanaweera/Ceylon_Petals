import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

export const healthRouter = Router()

// Is the server up? Used by hosting platforms and by you in the browser.
healthRouter.get('/', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() })
})

// Can the server reach the database?
healthRouter.get('/db', async (_req, res) => {
  try {
    await prisma.$queryRaw`select 1`
    res.json({ ok: true, database: 'up' })
  } catch (error) {
    console.error('[health] database check failed:', error)
    res.status(503).json({ ok: false, database: 'down' })
  }
})
