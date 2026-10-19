import 'dotenv/config'
import { prisma } from '../src/lib/prisma.js'

// Removes the orders and accounts that the browser test run creates, so they don't show up in the
// owner console (orders, customers, analytics) or hold back stock.
//
//   npm run db:clean-tests            lists what would be removed (changes nothing)
//   npm run db:clean-tests -- --apply removes it
//
// Only test data is touched: orders placed under the test names below, and customer accounts whose
// email starts with "e2e". Stock held by those orders goes back on sale first.

const TEST_NAMES = ['Failing Buyer', 'Card Buyer', 'Guest Buyer', 'E2E Customer']
const apply = process.argv.includes('--apply')

const testUsers = await prisma.user.findMany({ where: { role: 'CUSTOMER', email: { startsWith: 'e2e' } }, select: { id: true } })
const userIds = testUsers.map((u) => u.id)
const orders = await prisma.order.findMany({
  where: { OR: [{ customerName: { in: TEST_NAMES } }, { userId: { in: userIds } }] },
  include: { items: true },
})

// Cancelled and failed orders have already given their stock back; every other order still holds it.
const holding = orders.filter((o) => o.status !== 'CANCELLED' && o.status !== 'PAYMENT_FAILED')
const toReturn = holding.flatMap((o) => o.items).filter((i) => i.productId)
const units = toReturn.reduce((sum, i) => sum + i.quantity, 0)

console.log(`Test orders: ${orders.length}  (still holding ${units} items of stock)`)
console.log(`Test accounts: ${testUsers.length}`)

if (!apply) {
  console.log('\nNothing changed. Run again with --apply to remove them:  npm run db:clean-tests -- --apply')
} else {
  await prisma.$transaction(
    async (tx) => {
      for (const item of toReturn) {
        await tx.product.updateMany({ where: { id: item.productId! }, data: { stock: { increment: item.quantity } } })
      }
      await tx.order.deleteMany({ where: { id: { in: orders.map((o) => o.id) } } })
      await tx.user.deleteMany({ where: { id: { in: userIds } } })
    },
    { timeout: 60_000 }
  )
  console.log(`\nRemoved ${orders.length} test orders and ${testUsers.length} test accounts; ${units} items are back in stock.`)
}

await prisma.$disconnect()
