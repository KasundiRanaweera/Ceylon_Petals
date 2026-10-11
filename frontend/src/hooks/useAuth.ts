import { useContext } from 'react'
import { AuthContext } from '../context/authContext'

// Usage: const { user, signIn, signOut } = useAuth()
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
