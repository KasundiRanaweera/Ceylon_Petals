import { useState, type InputHTMLAttributes } from 'react'
import { motion } from 'motion/react'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  id: string
  label: string
  /** Show a strength meter under the field (for new passwords). */
  showStrength?: boolean
  hint?: string
}

const LEVELS = [
  { label: 'Too short', color: 'bg-error' },
  { label: 'Weak', color: 'bg-error' },
  { label: 'Okay', color: 'bg-tertiary-container' },
  { label: 'Good', color: 'bg-emerald-500' },
  { label: 'Strong', color: 'bg-emerald-700' },
]

function strength(pw: string): number {
  if (pw.length < 8) return 0
  let score = 1
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) score++
  return Math.min(score, 4)
}

export default function PasswordField({ id, label, showStrength = false, hint, value, required, ...rest }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const text = String(value ?? '')
  const level = strength(text)

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-label-md text-on-surface">
        {label}
        {required && <span className="text-error"> *</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          value={value}
          required={required}
          aria-describedby={showStrength || hint ? `${id}-help` : undefined}
          className="min-h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 pr-12 text-body-md text-on-surface placeholder:text-outline transition-colors focus:border-[#d4af37] focus:outline-none focus:ring-4 focus:ring-[#d4af37]/25"
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-tertiary focus-visible:outline-2 focus-visible:outline-[#d4af37]"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {showStrength && text.length > 0 ? (
        <div id={`${id}-help`} className="space-y-1" aria-live="polite">
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-container">
                <motion.div
                  className={`h-full ${LEVELS[level].color}`}
                  initial={false}
                  animate={{ scaleX: i <= level ? 1 : 0 }}
                  style={{ originX: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            ))}
          </div>
          <p className="text-body-sm text-on-surface-variant">
            Password strength: <span className="font-semibold text-on-surface">{LEVELS[level].label}</span>
            {level < 3 && ' — try mixing upper and lower case, numbers and a symbol.'}
          </p>
        </div>
      ) : (
        hint && <p id={`${id}-help`} className="text-body-sm text-on-surface-variant">{hint}</p>
      )}
    </div>
  )
}
