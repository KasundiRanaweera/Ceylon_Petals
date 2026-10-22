import { createHash, randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { env } from '../config/env.js'
import { prisma } from '../lib/prisma.js'
import { notFound, unprocessable } from '../lib/errors.js'
import { signAuthToken } from '../lib/tokens.js'
import { toUserDto, type UserDto } from './auth.js'

// Forgotten passwords. The shop sends no email, so the owner creates a one-time link for the
// customer in the owner console and passes it on (for example on WhatsApp). The customer opens it
// and chooses a new password.
//
// - The link holds 32 random bytes. Only their SHA-256 hash is stored.
// - It works once, for RESET_LINK_MINUTES. Making a new link cancels the customer's older ones.
// - Using it signs the customer out everywhere else (tokenVersion + 1) and signs them in here.

export const RESET_LINK_MINUTES = 30

const EXPIRED = 'This link has expired or has already been used. Please ask the shop for a new one.'

const hashOf = (token: string) => createHash('sha256').update(token).digest('hex')

/** Owner: makes a reset link for a customer account. Returns the secret token (shown once). */
export async function createPasswordReset(userId: string): Promise<{ token: string; expiresAt: string; customer: { name: string; email: string; phone: string } }> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, phone: true, role: true } })
  // Owner accounts are reset with `npm run owner:reset`, never by a link.
  if (!user || user.role !== 'CUSTOMER') throw notFound('That customer account was not found.')

  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + RESET_LINK_MINUTES * 60_000)
  await prisma.$transaction([
    prisma.passwordReset.deleteMany({ where: { userId: user.id } }),
    prisma.passwordReset.create({ data: { userId: user.id, tokenHash: hashOf(token), expiresAt } }),
  ])
  return { token, expiresAt: expiresAt.toISOString(), customer: { name: user.name, email: user.email, phone: user.phone } }
}

/** Customer: is this link still good? Returns the first name to greet them with. */
export async function checkPasswordReset(token: string): Promise<{ name: string }> {
  const found = await prisma.passwordReset.findUnique({ where: { tokenHash: hashOf(token) }, include: { user: { select: { name: true } } } })
  if (!found || found.usedAt || found.expiresAt <= new Date()) throw unprocessable(EXPIRED)
  return { name: found.user.name.trim().split(/\s+/)[0] ?? found.user.name }
}

/** Customer: sets the new password with a good link, and returns them signed in. */
export async function resetPassword(token: string, newPassword: string): Promise<{ user: UserDto; token: string }> {
  const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS)
  return prisma.$transaction(async (tx) => {
    const now = new Date()
    const found = await tx.passwordReset.findUnique({ where: { tokenHash: hashOf(token) }, select: { id: true, userId: true } })
    if (!found) throw unprocessable(EXPIRED)
    // Claim the link: only one request can turn usedAt from empty to now, so a link pressed twice
    // (or used by two people at once) changes the password only once.
    const claimed = await tx.passwordReset.updateMany({ where: { id: found.id, usedAt: null, expiresAt: { gt: now } }, data: { usedAt: now } })
    if (claimed.count !== 1) throw unprocessable(EXPIRED)

    const user = await tx.user.update({
      where: { id: found.userId },
      data: { passwordHash, tokenVersion: { increment: 1 } },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true, tokenVersion: true },
    })
    await tx.passwordReset.deleteMany({ where: { userId: user.id, id: { not: found.id } } })
    return { user: toUserDto(user), token: signAuthToken(user) }
  })
}

/** Removes links that can no longer be used (called by the hourly clean-up). */
export async function deleteOldPasswordResets(): Promise<number> {
  const { count } = await prisma.passwordReset.deleteMany({
    where: { OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { not: null } }] },
  })
  return count
}
