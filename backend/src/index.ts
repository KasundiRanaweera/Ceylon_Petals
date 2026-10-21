import { env } from './config/env.js'
import { createApp } from './app.js'
import { prisma } from './lib/prisma.js'
import { startCardOrderExpiryJob } from './jobs/expireCardOrders.js'
import { startPhotoCleanupJob } from './jobs/cleanUpPhotos.js'

const app = createApp()

const server = app.listen(env.PORT, () => {
  console.log(`API running on http://localhost:${env.PORT} (${env.NODE_ENV}, card payments: ${env.payhere.mode})`)
})

startCardOrderExpiryJob()
startPhotoCleanupJob()

// Finish in-flight requests and close the database connection before exiting,
// so a redeploy never cuts a customer's order in half.
async function shutdown(signal: string) {
  console.log(`${signal} received, shutting down`)
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
  setTimeout(() => process.exit(1), 10_000).unref()
}
process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))
