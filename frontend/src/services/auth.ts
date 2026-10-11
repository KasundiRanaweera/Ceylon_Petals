import type { Address, User } from '../types'
import { commit, db, delay, fail, newId, type StoredUser } from './mockDb'
import { isValidPhone, normalizePhone } from '../lib/phone'

// Future endpoints:
//   POST /api/auth/register   POST /api/auth/login   POST /api/auth/logout   GET /api/auth/me
//   PATCH /api/me             GET/POST /api/me/addresses   PUT/DELETE /api/me/addresses/:id
//
// The backend should keep the session in an httpOnly cookie. Here we only remember the user id.

const SESSION_KEY = 'ceylon-petals-session'

function publicUser(user: StoredUser): User {
  return { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, createdAt: user.createdAt }
}

export function getSessionUser(): Promise<User | null> {
  let id: string | null = null
  try {
    id = localStorage.getItem(SESSION_KEY)
  } catch {
    id = null
  }
  const user = id ? db().users.find((u) => u.id === id) : undefined
  return delay(user ? publicUser(user) : null, 0)
}

function startSession(user: StoredUser) {
  try {
    localStorage.setItem(SESSION_KEY, user.id)
  } catch {
    // Session just won't survive a reload.
  }
}

export function signIn(email: string, password: string): Promise<User> {
  const user = db().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
  if (!user || user.password !== password) return fail('That email and password do not match. Please try again.', 400)
  startSession(user)
  return delay(publicUser(user), 400)
}

export interface RegisterInput {
  name: string
  email: string
  phone: string
  password: string
}

/** Public sign-up always creates a CUSTOMER. Owner accounts are only ever created on the server. */
export function register(input: RegisterInput): Promise<User> {
  const email = input.email.trim().toLowerCase()
  if (!input.name.trim()) return fail('Please enter your name.')
  if (!/^\S+@\S+\.\S+$/.test(email)) return fail('Please enter a valid email address.')
  if (!isValidPhone(input.phone)) return fail('Please enter a valid phone number.')
  if (input.password.length < 8) return fail('Your password needs at least 8 characters.')
  if (db().users.some((u) => u.email === email)) return fail('An account with this email already exists. Try signing in.')

  const user: StoredUser = {
    id: newId('u'),
    name: input.name.trim(),
    email,
    phone: normalizePhone(input.phone),
    role: 'CUSTOMER',
    createdAt: new Date().toISOString(),
    password: input.password,
  }
  db().users.push(user)
  commit()
  startSession(user)
  return delay(publicUser(user), 400)
}

export function signOut(): Promise<void> {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // nothing to clear
  }
  return delay(undefined, 0)
}

export function updateProfile(userId: string, changes: { name: string; phone: string }): Promise<User> {
  const user = db().users.find((u) => u.id === userId)
  if (!user) return fail('Please sign in again.')
  if (!changes.name.trim()) return fail('Please enter your name.')
  if (!isValidPhone(changes.phone)) return fail('Please enter a valid phone number.')
  user.name = changes.name.trim()
  user.phone = normalizePhone(changes.phone)
  commit()
  return delay(publicUser(user))
}

export function changePassword(userId: string, current: string, next: string): Promise<void> {
  const user = db().users.find((u) => u.id === userId)
  if (!user) return fail('Please sign in again.')
  if (user.password !== current) return fail('Your current password is not correct.')
  if (next.length < 8) return fail('Your new password needs at least 8 characters.')
  user.password = next
  commit()
  return delay(undefined)
}

// ---------------- Saved addresses ----------------

export function listAddresses(userId: string): Promise<Address[]> {
  return delay(db().addresses.filter((a) => a.userId === userId))
}

export type AddressInput = Omit<Address, 'id' | 'userId'> & { id?: string }

export function saveAddress(userId: string, input: AddressInput): Promise<Address> {
  if (!input.recipientName.trim() || !input.line1.trim() || !input.city.trim() || !input.district) {
    return fail('Please fill in the name, address, city and district.')
  }
  if (!isValidPhone(input.phone)) return fail('Please enter a valid phone number.')
  const all = db().addresses
  const mine = all.filter((a) => a.userId === userId)
  const makeDefault = input.isDefault || mine.length === 0
  if (makeDefault) mine.forEach((a) => (a.isDefault = false))

  const existing = input.id ? mine.find((a) => a.id === input.id) : undefined
  const saved: Address = {
    ...input,
    id: existing?.id ?? newId('a'),
    userId,
    phone: normalizePhone(input.phone),
    label: input.label.trim() || 'Address',
    isDefault: makeDefault,
  }
  if (existing) all[all.indexOf(existing)] = saved
  else all.push(saved)
  commit()
  return delay(saved)
}

export function deleteAddress(userId: string, id: string): Promise<void> {
  const data = db()
  const removed = data.addresses.find((a) => a.id === id && a.userId === userId)
  data.addresses = data.addresses.filter((a) => a !== removed)
  if (removed?.isDefault) {
    const next = data.addresses.find((a) => a.userId === userId)
    if (next) next.isDefault = true
  }
  commit()
  return delay(undefined)
}
