import { Router } from 'express'
import { healthRouter } from './health.js'
import { catalogRouter } from './catalog.js'
import { authRouter } from './auth.js'
import { accountRouter } from './account.js'
import { ordersRouter } from './orders.js'
import { settingsRouter } from './settings.js'
import { paymentsRouter } from './payments.js'
import { inquiriesRouter } from './inquiries.js'
import { reviewsRouter } from './reviews.js'
import { adminRouter } from './admin/index.js'

// Every route group is mounted here, one line each.
export const apiRouter = Router()

apiRouter.use('/health', healthRouter)
apiRouter.use('/auth', authRouter)
apiRouter.use('/me', accountRouter) // profile, password, saved addresses, my orders
apiRouter.use('/orders', ordersRouter) // quote, checkout, tracking, one order
apiRouter.use('/settings', settingsRouter) // public shop settings
apiRouter.use('/payments', paymentsRouter) // PayHere card payments
apiRouter.use('/inquiries', inquiriesRouter) // custom order requests from the website
apiRouter.use('/reviews', reviewsRouter) // published customer reviews
apiRouter.use('/admin', adminRouter) // the owner console (owner role only)
apiRouter.use(catalogRouter) // /products, /products/:slug, /categories, /occasions
