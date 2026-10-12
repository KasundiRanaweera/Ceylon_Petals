import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { FormError, TextField } from '../../components/ui/Field'
import { changePassword, updateProfile } from '../../services/auth'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { formatPhone } from '../../lib/phone'

export default function AccountProfile() {
  const { user, setUser } = useAuth()
  const { showToast } = useToast()
  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user ? formatPhone(user.phone) : '')
  const [passwords, setPasswords] = useState({ current: '', next: '' })

  const saveProfile = useMutation({
    mutationFn: () => updateProfile(user!.id, { name, phone }),
    onSuccess: (u) => {
      setUser(u)
      showToast('Profile updated')
    },
  })
  const savePassword = useMutation({
    mutationFn: () => changePassword(user!.id, passwords.current, passwords.next),
    onSuccess: () => {
      setPasswords({ current: '', next: '' })
      showToast('Password changed')
    },
  })

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          saveProfile.mutate()
        }}
        className="bg-surface-container-lowest rounded-xl shadow-sm p-6 space-y-4"
      >
        <h2 className="font-display text-headline-sm text-primary">Your details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField id="name" label="Full name" required value={name} onChange={(e) => setName(e.target.value)} />
          <TextField id="phone" label="Mobile / WhatsApp" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} />
          <TextField id="email" label="Email" value={user?.email ?? ''} disabled hint="Contact us to change your email." className="sm:col-span-2" />
        </div>
        <FormError message={saveProfile.error ? saveProfile.error.message : null} />
        <button type="submit" disabled={saveProfile.isPending} className="px-5 py-2.5 rounded-lg bg-primary text-on-primary text-label-md disabled:opacity-60">
          Save changes
        </button>
      </form>

      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          savePassword.mutate()
        }}
        className="bg-surface-container-lowest rounded-xl shadow-sm p-6 space-y-4"
      >
        <h2 className="font-display text-headline-sm text-primary">Change password</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField id="current" label="Current password" type="password" required autoComplete="current-password" value={passwords.current} onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))} />
          <TextField id="next" label="New password" type="password" required minLength={8} autoComplete="new-password" value={passwords.next} onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))} />
        </div>
        <FormError message={savePassword.error ? savePassword.error.message : null} />
        <button type="submit" disabled={savePassword.isPending} className="px-5 py-2.5 rounded-lg bg-primary text-on-primary text-label-md disabled:opacity-60">
          Change password
        </button>
      </form>
    </div>
  )
}
