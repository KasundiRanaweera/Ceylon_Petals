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

function isClosedConnection(error: unknown): boolean {
  const text = `${(error as { message?: string })?.message ?? ''} ${String((error as { cause?: unknown })?.cause ?? '')}`
  return /ConnectionClosed|Connection terminated|server closed the connection|ECONNRESET/i.test(text)
}

// If a read lands on a connection the pooler has just closed, try it once more on a fresh one.
export const prisma = base.$extends({
  query: {
    $allModels: {
      async $allOperations({ operation, args, query }) {
        try {
          return await query(args)
        } catch (error) {
          if (!READS.has(operation) || !isClosedConnection(error)) throw error
          return query(args)
        }
      },
    },
  },
}) as unknown as typeof base
