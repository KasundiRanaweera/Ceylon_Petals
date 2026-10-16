import { env } from '../config/env.js'
import { expireUnpaidCardOrders } from '../services/payments.js'

const EVERY_MINUTES = 5

async function run() {
  try {
    const expired = await expireUnpaidCardOrders()
    if (expired > 0) console.log(`[payments] ${expired} unpaid card order(s) expired after ${env.payhere.windowMinutes} minutes; their stock is back on sale`)
  } catch (error) {
    console.error('[payments] checking for unpaid card orders failed:', error)
  }
}

/**
 * Runs once now and then every few minutes while the server is up. This is safe to run on more
 * than one server at a time: each order can only be expired once.
 */
export function startCardOrderExpiryJob() {
  if (env.payhere.mode === 'disabled') return
  void run()
  setInterval(() => void run(), EVERY_MINUTES * 60_000).unref()
}
