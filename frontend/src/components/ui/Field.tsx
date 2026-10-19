import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

// Form fields with one consistent look across checkout, account, inquiry and admin forms.

const control =
  'w-full min-h-11 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:border-[#d4af37] focus:outline-none focus:ring-1 focus:ring-[#d4af37] disabled:bg-surface-container-low disabled:opacity-70 aria-[invalid=true]:border-error aria-[invalid=true]:ring-error'

interface WrapperProps {
  id: string
  label: string
  hint?: ReactNode
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
}

function Wrapper({ id, label, hint, error, required, children, className = '' }: WrapperProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={id} className="block text-[14px] font-medium text-on-surface-variant">
        {label}
        {required && <span className="text-error"> *</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-body-sm text-error">{error}</p>
      ) : (
        hint && <p id={`${id}-hint`} className="text-body-sm text-on-surface-variant">{hint}</p>
      )}
    </div>
  )
}

type Common = { id: string; label: string; hint?: ReactNode; error?: string; className?: string }

export function TextField({ id, label, hint, error, className, required, ...rest }: Common & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Wrapper id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <input
        id={id}
        name={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={control}
        {...rest}
      />
    </Wrapper>
  )
}

export function SelectField({
  id, label, hint, error, className, required, children, ...rest
}: Common & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Wrapper id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <select
        id={id}
        name={id}
        required={required}
        aria-invalid={error ? true : undefined}
        className={`${control} cursor-pointer`}
        {...rest}
      >
        {children}
      </select>
    </Wrapper>
  )
}

export function TextAreaField({
  id, label, hint, error, className, required, ...rest
}: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Wrapper id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <textarea
        id={id}
        name={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={control}
        {...rest}
      />
    </Wrapper>
  )
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div role="alert" className="bg-error-container text-on-error-container rounded-lg px-4 py-3 text-body-sm">
      {message}
    </div>
  )
}
