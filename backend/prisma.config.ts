import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// The Prisma CLI (migrate, db push, studio) uses DIRECT_URL, the direct Supabase connection.
// The running API uses DATABASE_URL (the pooled connection) through src/lib/prisma.ts.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx src/seed/seed.ts',
  },
  datasource: {
    url: process.env.DIRECT_URL,
  },
})
