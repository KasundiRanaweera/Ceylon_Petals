import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { KeyRound, Loader2, MessageCircle } from 'lucide-react'
import AuthLayout from '../components/auth/AuthLayout'
import PasswordField from '../components/auth/PasswordField'
import { authSubmitClass as submitClass } from '../components/auth/styles'
import { FormError } from '../components/ui/Field'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { useWhatsApp } from '../hooks/useShop'
import { checkPasswordReset, resetPassword } from '../services/auth'

// Where a customer lands from the one-time link the shop sent them: /reset-password#<token>.
// The token is in the part after "#", which browsers never send to any server or in a Referer,
// so it does not end up in logs. It is read once and then removed from the address bar.

const readHashToken = () => (typeof window === 'undefined' ? '' : window.location.hash.replace(/^#/, '').trim())

export default function ResetPassword() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const { showToast } = useToast()
  const whatsapp = useWhatsApp()
  const [token, setToken] = useState(readHashToken)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Keep the secret out of the address bar (and out of anything copied from it). A link pasted in
  // while this page is already open only changes the part after "#", so listen for that too.
  useEffect(() => {
    function take() {
      const fresh = readHashToken()
      if (!fresh) return
      setToken(fresh)
      setError(null)
      window.history.replaceState(null, '', window.location.pathname)
    }
    take()
    window.addEventListener('hashchange', take)
    return () => window.removeEventListener('hashchange', take)
  }, [])

  const link = useQuery({ queryKey: ['password-reset', token], queryFn: () => checkPasswordReset(token), enabled: token.length > 0, retry: false, staleTime: Infinity })
  const mismatch = confirm.length > 0 && confirm !== password

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('The two passwords do not match.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const user = await resetPassword(token, password)
      setUser(user)
      showToast('Your new password is saved and you are signed in')
      navigate('/account', { replace: true })
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  const askAgain = (
    <a
      href={whatsapp('Hello! My password reset link has expired. Could you send me a new one, please?')}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-surface-container-high px-5 text-title-md text-on-surface hover:bg-surface-container-highest"
    >
      <MessageCircle size={18} className="text-[#25D366]" /> Ask the shop for a new link
    </a>
  )

  if (!token || link.isError) {
    return (
      <AuthLayout
        eyebrow="Password reset"
        title={token ? 'This link no longer works' : 'This link is not complete'}
        subtitle={
          token
            ? (link.error as Error).message
            : 'Please open the whole link the shop sent you. If it was cut off, ask for a new one.'
        }
      >
        <div className="space-y-4">
          {askAgain}
          <p className="text-center text-body-sm text-on-surface-variant">
            Remembered it? <Link to="/sign-in" className="text-tertiary underline underline-offset-4 hover:text-on-surface">Sign in</Link>
          </p>
        </div>
      </AuthLayout>
    )
  }

  if (link.isLoading) {
    return (
      <AuthLayout eyebrow="Password reset" title="Checking your link…" subtitle="This only takes a moment.">
        <div className="flex justify-center py-6" aria-busy="true">
          <Loader2 size={24} className="animate-spin text-tertiary" />
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      eyebrow="Password reset"
      title={`Choose a new password${link.data?.name ? `, ${link.data.name}` : ''}`}
      subtitle="Use at least 8 characters. Once it is saved you will be signed in, and signed out on any other device."
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        <PasswordField id="new-password" label="New password" required showStrength autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <PasswordField
          id="confirm-password"
          label="Type it again"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          hint={mismatch ? 'The two passwords do not match.' : undefined}
        />
        <FormError message={error} />
        <button type="submit" disabled={busy || password.length === 0} className={submitClass}>
          {busy ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />}
          {busy ? 'Saving…' : 'Save new password'}
        </button>
      </form>
    </AuthLayout>
  )
}
