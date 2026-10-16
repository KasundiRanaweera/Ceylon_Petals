import { Router } from 'express'
import { healthRouter } from './health.js'
import { catalogRouter } from './catalog.js'
import { authRouter } from './auth.js'
import { accountRouter } from './account.js'
import { ordersRouter } from './orders.js'
import { settingsRouter } from './settings.js'
import { paymentsRouter } from './payments.js'

// Every route group is mounted here. Later steps add one line each:
//   router.use('/admin', adminRouter)          (Step 10)
export const apiRouter = Router()

apiRouter.use('/health', healthRouter)
apiRouter.use('/auth', authRouter)
apiRouter.use('/me', accountRouter) // profile, password, saved addresses, my orders
apiRouter.use('/orders', ordersRouter) // quote, checkout, tracking, one order
apiRouter.use('/settings', settingsRouter) // public shop settings
apiRouter.use('/payments', paymentsRouter) // PayHere card payments
apiRouter.use(catalogRouter) // /products, /products/:slug, /categories, /occasions
