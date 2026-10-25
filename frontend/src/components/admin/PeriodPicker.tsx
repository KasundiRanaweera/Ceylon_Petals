import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Check, ChevronDown } from 'lucide-react'
import { isoDate } from '../../lib/dates'
import { customPeriod, MAX_DAYS, periodDays, periodLabel, presetPeriod, PRESETS, rangeText, type Period } from '../../lib/period'

// The period control on the owner's report pages: preset rows with a check on the chosen one, and a
// custom from–to range below a divider. Choosing a preset applies at once; a custom range on "Apply".
export default function PeriodPicker({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState(value.from)
  const [to, setTo] = useState(value.to)
  const box = useRef<HTMLDivElement>(null)
  const today = isoDate(0)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !box.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  function toggle() {
    // the custom fields start from whatever is showing now
    if (!open) {
      setFrom(value.from)
      setTo(value.to)
    }
    setOpen((v) => !v)
  }

  const error = !from || !to ? 'Pick both dates.' : from > to ? 'The start must be before the end.' : periodDays({ from, to }) > MAX_DAYS ? `Pick at most ${MAX_DAYS} days.` : ''

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggle}
        className="flex min-h-[38px] cursor-pointer items-center gap-2 rounded-lg bg-surface-container-lowest px-3.5 py-2 text-label-md text-on-surface shadow-sm ring-1 ring-outline-variant/50 transition-colors hover:bg-surface-container-low"
      >
        <CalendarDays size={16} aria-hidden="true" className="text-primary" />
        <span className="font-semibold">{periodLabel(value)}</span>
        {value.preset !== 'custom' && <span className="hidden text-secondary md:inline">· {rangeText(value)}</span>}
        <ChevronDown size={15} aria-hidden="true" className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div role="dialog" aria-label="Choose a period" className="absolute right-0 z-30 mt-2 w-72 rounded-xl bg-surface-container-lowest p-1.5 shadow-lg ring-1 ring-outline-variant/50">
          <ul>
            {PRESETS.map((p) => {
              const selected = value.preset === p.id
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(presetPeriod(p.id))
                      setOpen(false)
                    }}
                    className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-body-sm transition-colors hover:bg-surface-container-low ${selected ? 'font-bold text-primary' : 'text-on-surface'}`}
                  >
                    <Check size={16} aria-hidden="true" strokeWidth={3} className={selected ? 'opacity-100' : 'opacity-0'} />
                    <span className="flex-1">{p.label}</span>
                    <span className="text-[11px] font-normal text-secondary">{rangeText(presetPeriod(p.id))}</span>
                  </button>
                </li>
              )
            })}
          </ul>

          <form
            className="mt-1.5 border-t border-surface-container px-3 pb-2 pt-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (error) return
              onChange(customPeriod(from, to))
              setOpen(false)
            }}
          >
            <p className={`mb-2 flex items-center gap-2 text-[11px] uppercase tracking-wider ${value.preset === 'custom' ? 'font-bold text-primary' : 'text-secondary'}`}>
              {value.preset === 'custom' && <Check size={14} aria-hidden="true" strokeWidth={3} />}
              Custom range
            </p>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[12px] text-secondary">
                From
                <input type="date" value={from} max={today} onChange={(e) => setFrom(e.target.value)} className="mt-1 block w-full rounded-lg bg-surface-container-low px-2 py-1.5 text-body-sm text-on-surface ring-1 ring-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary" />
              </label>
              <label className="text-[12px] text-secondary">
                To
                <input type="date" value={to} max={today} onChange={(e) => setTo(e.target.value)} className="mt-1 block w-full rounded-lg bg-surface-container-low px-2 py-1.5 text-body-sm text-on-surface ring-1 ring-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary" />
              </label>
            </div>
            <p role="status" className="mt-2 min-h-[1.25rem] text-[12px] text-secondary">
              {error ? <span className="text-error">{error}</span> : `${periodDays({ from, to })} ${periodDays({ from, to }) === 1 ? 'day' : 'days'}`}
            </p>
            <button
              type="submit"
              disabled={!!error}
              className="mt-1 w-full cursor-pointer rounded-lg bg-primary px-3 py-2 text-label-md text-on-primary transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-50"
            >
              Apply range
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
