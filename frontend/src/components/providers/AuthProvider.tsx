import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AuthContext } from '../../context/authContext'
import * as auth from '../../services/auth'
import type { User } from '../../types'

export default function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    auth.getSessionUser().then((u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const u = await auth.signIn(email, password)
    setUser(u)
    return u
  }, [])

  const register = useCallback(async (input: auth.RegisterInput) => {
    const u = await auth.register(input)
    setUser(u)
    return u
  }, [])

  const signOut = useCallback(async () => {
    await auth.signOut()
    setUser(null)
    // Drop anything cached for the previous user (orders, addresses).
    queryClient.removeQueries({ queryKey: ['me'] })
  }, [queryClient])

  const value = useMemo(
    () => ({ user, loading, signIn, register, signOut, setUser }),
    [user, loading, signIn, register, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
