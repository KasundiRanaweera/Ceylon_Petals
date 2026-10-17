import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { env } from './config/env.js'
import { apiRouter } from './routes/index.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { requestLogger } from './middleware/requestLogger.js'
import { authenticate } from './middleware/auth.js'
import { rejectForeignOrigins } from './middleware/originCheck.js'

// Builds the Express app without starting it, so tests can call it directly.
export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  // Behind Render/Railway (and a Vercel rewrite) the real visitor address is in a header. Rate limits
  // and logs need it, so we trust exactly TRUST_PROXY_HOPS proxies and no more (more would let
  // visitors fake their address).
  if (env.isProduction) app.set('trust proxy', env.TRUST_PROXY_HOPS)

  app.use(helmet())
  app.use(
    cors({
      // Only our own frontend may call the API from a browser. Requests with no Origin header
      // (curl, PayHere's server callback) are not browser requests, so they pass.
      origin: (origin, callback) => callback(null, !origin || env.corsOrigins.includes(origin)),
      credentials: true,
    })
  )
  app.use(requestLogger)
  app.use(express.json({ limit: '1mb' }))
  // PayHere's payment callback is form-encoded, not JSON.
  app.use(express.urlencoded({ extended: false, limit: '100kb' }))
  app.use(cookieParser())
  app.use(rejectForeignOrigins) // CSRF protection for anything that changes data
  app.use(authenticate) // sets req.user when there is a valid login cookie

  app.use('/api', apiRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
