import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { LogIn, UserPlus, Loader2, ShoppingBag } from 'lucide-react'
import AuthLayout from '../components/auth/AuthLayout'
import AuthTabs from '../components/auth/AuthTabs'
import PasswordField from '../components/auth/PasswordField'
import DemoAccountHint from '../components/auth/DemoAccountHint'
import { FormError, TextField } from '../components/ui/Field'
import { useAuth } from '../hooks/useAuth'
import { useWhatsApp } from '../hooks/useShop'
import { DEMO_CUSTOMER } from '../data/seed'
import { safeNext } from '../lib/redirect'
import { EASE_OUT } from '../components/motion/variants'

type Mode = 'sign-in' | 'register'

const COPY: Record<Mode, { eyebrow: string; title: string; subtitle: string }> = {
  'sign-in': {
    eyebrow: 'Welcome back',
    title: 'Sign in to your account',
    subtitle: 'See your orders, follow deliveries and check out faster with saved addresses.',
  },
  register: {
    eyebrow: 'Join us',
    title: 'Create your account',
    subtitle: 'It takes a minute. Save the addresses you send flowers to and follow every order.',
  },
}

const submitClass =
  'flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl btn-gradient py-3.5 text-title-md disabled:cursor-not-allowed disabled:opacity-60'

function SignInForm({ next }: { next: string }) {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const whatsapp = useWhatsApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const u = await signIn(email, password)
      navigate(u.role === 'OWNER' ? '/admin' : next, { replace: true })
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <TextField id="email" label="Email" type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <PasswordField id="password" label="Password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <div className="flex justify-end">
        {/* TODO (backend): replace with a real password-reset email once the API sends mail. */}
        <a href={whatsapp('Hello! I forgot my password for my account.')} target="_blank" rel="noopener noreferrer" className="text-label-md text-primary hover:underline">
          Forgot your password?
        </a>
      </div>
      <FormError message={error} />
      <button type="submit" disabled={busy} className={submitClass}>
        {busy ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
      <DemoAccountHint email={DEMO_CUSTOMER.email} password={DEMO_CUSTOMER.password} />
    </form>
  )
}

function RegisterForm({ next }: { next: string }) {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const mismatch = form.confirm.length > 0 && form.confirm !== form.password

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setError('The two passwords do not match.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await register({ name: form.name, email: form.email, phone: form.phone, password: form.password })
      navigate(next, { replace: true })
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <TextField id="name" label="Full name" required autoComplete="name" placeholder="Nimali Perera" value={form.name} onChange={set('name')} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField id="email" label="Email" type="email" required autoComplete="email" value={form.email} onChange={set('email')} />
        <TextField id="phone" label="Mobile / WhatsApp" type="tel" required autoComplete="tel" placeholder="077 123 4567" value={form.phone} onChange={set('phone')} />
      </div>
      <PasswordField id="password" label="Password" required autoComplete="new-password" showStrength value={form.password} onChange={set('password')} />
      <TextField
        id="confirm"
        label="Confirm password"
        type="password"
        required
        autoComplete="new-password"
        value={form.confirm}
        onChange={set('confirm')}
        error={mismatch ? 'The two passwords do not match.' : undefined}
      />
      <FormError message={error} />
      <button type="submit" disabled={busy} className={submitClass}>
        {busy ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
        {busy ? 'Creating account…' : 'Create account'}
      </button>
      <p className="text-center text-body-sm text-secondary">
        By creating an account you agree to our <Link to="/privacy" className="underline">privacy terms</Link>.
      </p>
    </form>
  )
}

// One component for /sign-in and /register, so switching tabs keeps the photo panel running
// and only the form changes.
export default function AuthPage({ mode }: { mode: Mode }) {
  const [params] = useSearchParams()
  const { user } = useAuth()
  const next = safeNext(params.get('next'), '/account')
  const copy = COPY[mode]

  if (user) return <Navigate to={user.role === 'OWNER' ? '/admin' : next} replace />

  return (
    <AuthLayout
      eyebrow={copy.eyebrow}
      title={copy.title}
      subtitle={copy.subtitle}
      footer={
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-surface-container-high p-4 text-body-sm text-secondary">
          <ShoppingBag size={18} className="shrink-0 text-primary" />
          <span>
            Just want to send flowers? You can <Link to="/shop" className="font-semibold text-primary hover:underline">check out as a guest</Link> — no account needed.
          </span>
        </div>
      }
    >
      <div className="space-y-6">
        <AuthTabs active={mode} next={params.get('next') ?? undefined} />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: mode === 'register' ? 24 : -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: mode === 'register' ? -24 : 24 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
          >
            {mode === 'sign-in' ? <SignInForm next={next} /> : <RegisterForm next={next} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </AuthLayout>
  )
}
