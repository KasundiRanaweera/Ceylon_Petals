import { createContext } from 'react'
import type { User } from '../types'
import type { RegisterInput } from '../services/auth'

export interface AuthContextValue {
  user: User | null
  /** True until we know whether someone is signed in. */
  loading: boolean
  signIn: (email: string, password: string) => Promise<User>
  register: (input: RegisterInput) => Promise<User>
  signOut: () => Promise<void>
  setUser: (user: User) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
