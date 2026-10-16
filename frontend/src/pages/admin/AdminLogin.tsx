import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { FormError, TextField } from '../../components/ui/Field'
import PasswordField from '../../components/auth/PasswordField'
import { Blobs } from '../../components/motion/Ambient'
import { motion } from 'motion/react'
import { EASE_OUT } from '../../components/motion/variants'
import { useAuth } from '../../hooks/useAuth'
import { useShop } from '../../hooks/useShop'
import { safeNext } from '../../lib/redirect'

// Owner sign-in. Only accounts with the OWNER role get in — a customer account is refused here
// even with the right password. There is no way to register as an owner from the website.
export default function AdminLogin() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { user, signIn, signOut } = useAuth()
  const { shopName } = useShop()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const next = safeNext(params.get('next'), '/admin')

  if (user?.role === 'OWNER') return <Navigate to={next} replace />

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const u = await signIn(email, password)
      if (u.role !== 'OWNER') {
        await signOut()
        setError('This is a customer account. Only the shop owner can sign in here.')
        setBusy(false)
        return
      }
      navigate(next.startsWith('/admin') ? next : '/admin', { replace: true })
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-primary flex items-center justify-center px-4 py-12">
      <Blobs tone="dark" />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
        className="relative w-full max-w-md bg-surface-container-lowest/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 sm:p-10 space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-primary-container text-on-primary flex items-center justify-center">
            <Lock size={20} />
          </div>
          <h1 className="font-display text-headline-lg text-primary">{shopName} owner console</h1>
          <p className="text-body-md text-secondary">Sign in with the owner account.</p>
        </div>
        {user?.role === 'CUSTOMER' && (
          <p className="bg-tertiary-fixed/60 text-on-tertiary-fixed rounded-lg p-3 text-body-sm">
            You're signed in as a customer ({user.email}). Sign in with the owner account to continue.
          </p>
        )}
        <form onSubmit={submit} className="space-y-4">
          <TextField id="email" label="Email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          <PasswordField id="password" label="Password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <FormError message={error} />
          <button type="submit" disabled={busy} className="w-full cursor-pointer bg-primary-container text-on-primary hover:bg-primary text-title-md py-3.5 rounded-xl disabled:opacity-60">
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <Link to="/" className="block text-center text-label-md text-primary hover:underline">← Back to the shop</Link>
      </motion.div>
    </div>
  )
}
