import bcrypt from 'bcryptjs'
import { env } from '../config/env.js'
import { prisma } from '../lib/prisma.js'
import { conflict, unauthorized } from '../lib/errors.js'
import { signAuthToken, verifyAuthToken } from '../lib/tokens.js'

// Account logic: create customers, check passwords, turn a login cookie back into a user.

/** What the browser is allowed to know about a user. Never includes the password hash. */
export interface UserDto {
  id: string
  name: string
  email: string
  phone: string
  role: 'CUSTOMER' | 'OWNER'
  createdAt: string
}

const userSelect = { id: true, name: true, email: true, phone: true, role: true, createdAt: true } as const

export function toUserDto(u: { id: string; name: string; email: string; phone: string; role: 'CUSTOMER' | 'OWNER'; createdAt: Date }): UserDto {
  return { id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, createdAt: u.createdAt.toISOString() }
}

// Used to keep login timing the same whether or not the email exists, so an attacker cannot
// discover which emails have accounts by measuring how fast the answer comes back.
const dummyHash = bcrypt.hash('not-a-real-password', env.BCRYPT_ROUNDS)

export interface RegisterInput {
  name: string
  email: string
  phone: string
  password: string
}

/**
 * Public sign-up. The role is NOT part of the input and is not read from the request:
 * everyone who registers here is a CUSTOMER. Owner accounts are only created by the seed script.
 */
export async function registerCustomer(input: RegisterInput): Promise<{ user: UserDto; token: string }> {
  const existing = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } })
  if (existing) throw conflict('An account with this email already exists. Try signing in.')

  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS)
  try {
    const created = await prisma.user.create({
      data: { name: input.name, email: input.email, phone: input.phone, passwordHash, role: 'CUSTOMER' },
      select: { ...userSelect, tokenVersion: true },
    })
    return { user: toUserDto(created), token: signAuthToken(created) }
  } catch (error) {
    // Two people registering the same email at the same moment: the database unique index decides.
    if ((error as { code?: string }).code === 'P2002') throw conflict('An account with this email already exists. Try signing in.')
    throw error
  }
}

export async function loginWithPassword(email: string, password: string): Promise<{ user: UserDto; token: string }> {
  const found = await prisma.user.findUnique({
    where: { email },
    select: { ...userSelect, passwordHash: true, tokenVersion: true },
  })
  const matches = await bcrypt.compare(password, found?.passwordHash ?? (await dummyHash))
  // Same message whether the email is unknown or the password is wrong.
  if (!found || !matches) throw unauthorized('That email and password do not match. Please try again.')
  return { user: toUserDto(found), token: signAuthToken(found) }
}

/** Turns a cookie value into the current user, or null if it is invalid, expired or revoked. */
export async function userFromToken(token: string): Promise<UserDto | null> {
  const verified = verifyAuthToken(token)
  if (!verified) return null
  const user = await prisma.user.findUnique({ where: { id: verified.userId }, select: { ...userSelect, tokenVersion: true } })
  if (!user || user.tokenVersion !== verified.tokenVersion) return null
  return toUserDto(user)
}

/** "Sign out everywhere": every login token issued so far stops working. */
export async function revokeAllSessions(userId: string): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { tokenVersion: { increment: 1 } } })
}
