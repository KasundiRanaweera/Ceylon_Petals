import type { Address, User } from '../types'
import { del, get, patch, post, put } from '../lib/api'

// Talks to the backend's /api/auth and /api/me routes.
// The login itself is an httpOnly cookie set by the server: this code never sees or stores a token.

/** Who is signed in, or null for a visitor. (The server answers 200 with null for visitors.) */
export function getSessionUser(): Promise<User | null> {
  return get<User | null>('/auth/me').catch(() => null)
}

export function signIn(email: string, password: string): Promise<User> {
  return post<User>('/auth/login', { email, password })
}

export interface RegisterInput {
  name: string
  email: string
  phone: string
  password: string
}

/** Public sign-up always creates a CUSTOMER. Owner accounts are only ever created on the server. */
export function register(input: RegisterInput): Promise<User> {
  return post<User>('/auth/register', input)
}

// Forgotten password: the customer opens the one-time link the shop sent them (see ResetPassword.tsx).
export function checkPasswordReset(token: string): Promise<{ name: string }> {
  return post<{ name: string }>('/auth/password-reset/check', { token })
}

export function resetPassword(token: string, password: string): Promise<User> {
  return post<User>('/auth/password-reset', { token, password })
}

export function signOut(): Promise<void> {
  return post<void>('/auth/logout').then(() => undefined)
}

// The user id arguments below are kept so the pages did not need to change; the server uses the
// signed-in user from the cookie, so they can never be used to touch someone else's account.

export function updateProfile(_userId: string, changes: { name: string; phone: string }): Promise<User> {
  return patch<User>('/me', changes)
}

export function changePassword(_userId: string, currentPassword: string, newPassword: string): Promise<void> {
  return post<User>('/me/password', { currentPassword, newPassword }).then(() => undefined)
}

// ---------------- Saved addresses ----------------

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function listAddresses(_userId: string): Promise<Address[]> {
  return get<Address[]>('/me/addresses')
}

export type AddressInput = Omit<Address, 'id' | 'userId'> & { id?: string }

export function saveAddress(_userId: string, input: AddressInput): Promise<Address> {
  const { id, ...body } = input
  return id ? put<Address>(`/me/addresses/${id}`, body) : post<Address>('/me/addresses', body)
}

export function deleteAddress(_userId: string, id: string): Promise<void> {
  return del(`/me/addresses/${id}`)
}
