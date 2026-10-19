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
      className={`text-left cursor-pointer p-4 rounded-lg transition-all ${
        selected ? 'bg-[#d4af37]/10 ring-2 ring-[#d4af37]' : 'bg-surface-container-low ring-1 ring-outline-variant/40 hover:ring-[#d4af37]/60'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-title-md text-on-surface">{option.name}</span>
        {selected ? <CheckCircle2 size={20} className="text-tertiary" /> : <Circle size={20} className="text-outline" />}
      </div>
      <p className="text-body-sm text-on-surface-variant mb-2">{option.description}</p>
      <span className="text-currency-md text-tertiary">{formatLKR(option.price)}</span>
    </button>
  )
}