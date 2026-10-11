import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSettings } from '../services/shop'
import { DEFAULT_SETTINGS } from '../data/settings'
import { buildWhatsAppLink } from '../lib/whatsapp'

// Shop details (name, phone, WhatsApp number, delivery zones...) as set by the owner in Settings.
// Falls back to the defaults for the split second before they load, so nothing renders empty.
export function useShop() {
  const { data } = useQuery({ queryKey: ['settings'], queryFn: getSettings, staleTime: 5 * 60_000 })
  return data ?? DEFAULT_SETTINGS
}

/** Returns a function that builds a wa.me link to the shop's WhatsApp with a pre-filled message. */
export function useWhatsApp() {
  const { whatsappNumber } = useShop()
  return useCallback((message: string) => buildWhatsAppLink(message, whatsappNumber), [whatsappNumber])
}
