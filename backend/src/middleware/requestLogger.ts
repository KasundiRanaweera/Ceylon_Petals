import type { RequestHandler } from 'express'
import { env } from '../config/env.js'

// One line per request: "GET /api/products 200 14ms". Quiet during tests.
export const requestLogger: RequestHandler = (req, res, next) => {
  if (env.isTest) return next()
  const started = process.hrtime.bigint()
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - started) / 1_000_000
    console.log(`${req.method} ${req.originalUrl.split('?')[0]} ${res.statusCode} ${ms.toFixed(0)}ms`)
  })
  next()
}
