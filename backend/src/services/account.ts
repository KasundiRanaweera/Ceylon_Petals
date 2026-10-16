import bcrypt from 'bcryptjs'
import { env } from '../config/env.js'
import { prisma } from '../lib/prisma.js'
import { badRequest, notFound, unauthorized, unprocessable } from '../lib/errors.js'
import { signAuthToken } from '../lib/tokens.js'
import { toUserDto, type UserDto } from './auth.js'

// What a signed-in customer can do with their own account: profile, password, saved addresses.
// Every query here is scoped to the signed-in user's id, so nobody can read or change
// someone else's data by guessing an id.

// ---------------------------------------------------------------- profile

const userSelect = { id: true, name: true, email: true, phone: true, role: true, createdAt: true } as const

export async function updateProfile(userId: string, changes: { name: string; phone: string }): Promise<UserDto> {
  const user = await prisma.user.update({ where: { id: userId }, data: changes, select: userSelect })
  return toUserDto(user)
}

/**
 * Changes the password and signs the account out everywhere else. The device that made the
 * change gets a fresh token, so it stays signed in.
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ user: UserDto; token: string }> {
  const found = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } })
  if (!found) throw unauthorized()

  if (!(await bcrypt.compare(currentPassword, found.passwordHash))) {
    throw unprocessable('Your current password is not correct.')
  }
  if (currentPassword === newPassword) throw badRequest('Please choose a password you have not used just now.')

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS), tokenVersion: { increment: 1 } },
    select: { ...userSelect, tokenVersion: true },
  })
  return { user: toUserDto(updated), token: signAuthToken(updated) }
}

// ---------------------------------------------------------------- addresses

export const MAX_ADDRESSES = 10

export interface AddressDto {
  id: string
  userId: string
  label: string
  recipientName: string
  phone: string
  line1: string
  city: string
  district: string
  isDefault: boolean
}

export interface AddressInput {
  label: string
  recipientName: string
  phone: string
  line1: string
  city: string
  district: string
  isDefault: boolean
}

type AddressRow = AddressDto & { createdAt?: Date }

function toAddressDto(a: AddressRow): AddressDto {
  return {
    id: a.id,
    userId: a.userId,
    label: a.label,
    recipientName: a.recipientName,
    phone: a.phone,
    line1: a.line1,
    city: a.city,
    district: a.district,
    isDefault: a.isDefault,
  }
}

export async function listAddresses(userId: string): Promise<AddressDto[]> {
  const rows = await prisma.address.findMany({ where: { userId }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] })
  return rows.map(toAddressDto)
}

export async function createAddress(userId: string, input: AddressInput): Promise<AddressDto> {
  return prisma.$transaction(async (tx) => {
    const count = await tx.address.count({ where: { userId } })
    if (count >= MAX_ADDRESSES) throw unprocessable(`You can save up to ${MAX_ADDRESSES} addresses. Remove one first.`)

    // The first address is always the default.
    const isDefault = input.isDefault || count === 0
    if (isDefault) await tx.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } })

    const created = await tx.address.create({ data: { ...input, isDefault, userId } })
    return toAddressDto(created)
  })
}

export async function updateAddress(userId: string, id: string, input: AddressInput): Promise<AddressDto> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.address.findFirst({ where: { id, userId } })
    if (!existing) throw notFound('Address not found')

    // Un-ticking "default" on the only default would leave none, so keep it.
    const isDefault = input.isDefault || existing.isDefault
    if (isDefault && !existing.isDefault) {
      await tx.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } })
    }

    const updated = await tx.address.update({ where: { id }, data: { ...input, isDefault } })
    return toAddressDto(updated)
  })
}

export async function deleteAddress(userId: string, id: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.address.findFirst({ where: { id, userId } })
    if (!existing) throw notFound('Address not found')

    await tx.address.delete({ where: { id } })

    // If the default was removed, promote the most recent remaining address.
    if (existing.isDefault) {
      const next = await tx.address.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } })
      if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } })
    }
  })
}
