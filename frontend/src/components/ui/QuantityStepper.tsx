import { Minus, Plus } from 'lucide-react'

interface QuantityStepperProps {
  value: number
  max?: number
  onChange: (value: number) => void
  label: string
  size?: 'sm' | 'md'
}

export default function QuantityStepper({ value, max = 99, onChange, label, size = 'md' }: QuantityStepperProps) {
  const box = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'
  return (
    <div className="inline-flex items-center bg-surface-container-low rounded-lg" role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label="Decrease quantity"
        className={`${box} flex items-center justify-center text-primary rounded-lg hover:bg-surface-container disabled:opacity-40`}
      >
        <Minus size={16} />
      </button>
      <span className="min-w-8 text-center text-title-md text-on-surface" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Increase quantity"
        className={`${box} flex items-center justify-center text-primary rounded-lg hover:bg-surface-container disabled:opacity-40`}
      >
        <Plus size={16} />
      </button>
    </div>
  )
}
