import { Router } from 'express'
import { noStore } from '../../middleware/noStore.js'
import { requireOwner } from '../../middleware/auth.js'
import { adminCatalogRouter } from './catalog.js'
import { adminOrdersRouter } from './orders.js'
import { adminShopRouter } from './shop.js'
import { adminReviewsRouter } from './reviews.js'

// The owner console's API. Every route below needs the OWNER role: a guest gets 401, a signed-in
// customer gets 403. The guard is applied once, here, so no admin route can forget it.
export const adminRouter = Router()
adminRouter.use(noStore)
adminRouter.use(requireOwner)

adminRouter.use('/orders', adminOrdersRouter)
adminRouter.use('/reviews', adminReviewsRouter)
adminRouter.use(adminCatalogRouter) // /products, /categories, /uploads/sign
adminRouter.use(adminShopRouter) // /settings, /inquiries, /customers, /analytics
