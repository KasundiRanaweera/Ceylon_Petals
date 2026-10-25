import { useState } from 'react'
import { customPeriod, presetPeriod, PRESETS, type Period, type PresetId } from '../lib/period'

const KEY = 'cp-admin-period'

// The owner's chosen report period, shared by Overview and Analytics and remembered for this visit.
// Presets are stored by name, so "Last 7 days" still means the last 7 days tomorrow.
export function usePeriod(fallback: Exclude<PresetId, 'custom'>) {
  const [period, setPeriod] = useState<Period>(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as Period | null
      if (saved?.preset === 'custom' && /^\d{4}-\d{2}-\d{2}$/.test(saved.from) && /^\d{4}-\d{2}-\d{2}$/.test(saved.to)) return customPeriod(saved.from, saved.to)
      const preset = PRESETS.find((p) => p.id === saved?.preset)
      if (preset) return presetPeriod(preset.id)
    } catch {
      /* nothing saved, or storage blocked */
    }
    return presetPeriod(fallback)
  })

  function choose(next: Period) {
    setPeriod(next)
    try {
      sessionStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      /* private mode: kept for this page only */
    }
  }

  return [period, choose] as const
}
