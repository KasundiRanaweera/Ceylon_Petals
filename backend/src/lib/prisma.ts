import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.js'
import { env } from '../config/env.js'

// One shared client for the whole API. It uses DATABASE_URL, the pooled Supabase connection,
// which is the right one for a long-running server. (The Prisma CLI uses DIRECT_URL instead.)
//
// Supabase's pooler closes connections that sit idle, and a connection it has closed fails the next
// query with "ConnectionClosed". So the pool drops its own idle connections first (well before the
// pooler would), keeps the open ones alive, and gives a new connection a fair time to open.
const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 20_000,
  connectionTimeoutMillis: 15_000,
  keepAlive: true,
})

// Saving an order, a payment or a status change runs in a transaction. Prisma's default lets a
// transaction wait only 2 seconds for a free connection, which a slow moment on the pooler can exceed
// ("Unable to start a transaction in the given time"). Allow a realistic wait instead.
const base = new PrismaClient({ adapter, transactionOptions: { maxWait: 10_000, timeout: 20_000 } })

// Reads only: safe to try again, because reading twice changes nothing. Writes are never retried,
// so an order or a payment can never be saved twice.
const READS = new Set(['findUnique', 'findUniqueOrThrow', 'findFirst', 'findFirstOrThrow', 'findMany', 'count', 'aggregate', 'groupBy'])

// A dropped or briefly blocked connection (the pooler closing it, a network blip, a firewall or
// antivirus momentarily refusing it). These clear on their own, so a read is worth one more try.
function isTransientConnectionError(error: unknown): boolean {
  const e = error as { message?: string; code?: string; cause?: unknown }
  const text = `${e?.message ?? ''} ${e?.code ?? ''} ${String(e?.cause ?? '')}`
  return /ConnectionClosed|Connection terminated|server closed the connection|ECONNRESET|EACCES|ETIMEDOUT|DatabaseNotReachable/i.test(text)
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// If a read fails on a dropped connection, wait a moment and try it once more on a fresh one.
export const prisma = base.$extends({
  query: {
    $allModels: {
      async $allOperations({ operation, args, query }) {
        try {
          return await query(args)
        } catch (error) {
          if (!READS.has(operation) || !isTransientConnectionError(error)) throw error
          await pause(250)
          return query(args)
        }
      },
    },
  },
}) as unknown as typeof base
