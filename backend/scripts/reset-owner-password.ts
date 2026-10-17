import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma.js'

// Sets the owner's password to OWNER_PASSWORD from backend/.env (and signs the owner out everywhere).
// The seed never changes an existing owner's password on purpose, so use this when you forget it
// or change it in .env:   npm run owner:reset
//
// It creates the owner too if there is none yet. The password is never printed.

const email = process.env.OWNER_EMAIL?.trim().toLowerCase()
const password = process.env.OWNER_PASSWORD
const name = process.env.OWNER_NAME?.trim() || 'Shop Owner'

if (!email || !password) {
  console.error('Set OWNER_EMAIL and OWNER_PASSWORD in backend/.env first.')
  process.exit(1)
}
if (password.length < 8) {
  console.error('OWNER_PASSWORD must be at least 8 characters.')
  process.exit(1)
}

const passwordHash = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS ?? 12))
const existing = await prisma.user.findUnique({ where: { email } })

if (existing) {
  // tokenVersion + 1 signs the owner out of every device that was still logged in with the old password.
  await prisma.user.update({ where: { id: existing.id }, data: { passwordHash, role: 'OWNER', tokenVersion: { increment: 1 } } })
  console.log(`Password updated for ${email}. Sign in at /admin/login with the OWNER_PASSWORD from .env.`)
} else {
  await prisma.user.create({ data: { name, email, phone: '94000000000', passwordHash, role: 'OWNER' } })
  console.log(`Created the owner account ${email}.`)
}
await prisma.$disconnect()
