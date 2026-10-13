import { Router } from 'express'
import { healthRouter } from './health.js'
import { catalogRouter } from './catalog.js'
import { authRouter } from './auth.js'
import { accountRouter } from './account.js'

// Every route group is mounted here. Later steps add one line each:
//   router.use('/orders', ordersRouter)        (Step 8)
//   router.use('/admin', adminRouter)          (Step 10)
export const apiRouter = Router()

apiRouter.use('/health', healthRouter)
apiRouter.use('/auth', authRouter)
apiRouter.use('/me', accountRouter) // profile, password, saved addresses (orders are added in Step 8)
apiRouter.use(catalogRouter) // /products, /products/:slug, /categories, /occasions
