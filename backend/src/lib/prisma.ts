import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.js'
import { env } from '../config/env.js'

// One shared client for the whole API. It uses DATABASE_URL, the pooled Supabase connection,
// which is the right one for a long-running server. (The Prisma CLI uses DIRECT_URL instead.)
export const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL }) })
