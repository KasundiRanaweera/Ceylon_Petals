import { CheckCircle2, Circle } from 'lucide-react'
import { formatLKR } from '../../lib/format'

export interface BuilderOptionData {
  id: string
  name: string
  description: string
  price: number
}

export default function BuilderOption({
  option,
  selected,
  onSelect,
}: {
  option: BuilderOptionData
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`text-left cursor-pointer p-4 rounded-lg bg-surface-container transition-all hover:bg-secondary-container/50 ${
        selected ? 'ring-2 ring-primary' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-title-md text-primary">{option.name}</span>
        {selected ? <CheckCircle2 size={20} className="text-primary" /> : <Circle size={20} className="text-outline" />}
      </div>
      <p className="text-body-sm text-secondary mb-2">{option.description}</p>
      <span className="text-currency-md text-primary">{formatLKR(option.price)}</span>
    </button>
  )
}