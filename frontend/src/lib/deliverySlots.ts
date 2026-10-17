import type { DeliverySlotKey } from '../types/admin'
import type { DeliveryZone } from '../types'
import { colomboMinutes, isoDate } from './dates'

export interface DeliverySlot {
  key: DeliverySlotKey
  label: string
  hours: string
  /** Hour the slot starts (24h). Same-day slots close 2 hours before this. */
  startHour: number
  extraFee: number
  /** Midnight deliveries need our own van, so they're only offered in same-day zones. */
  sameDayZonesOnly?: boolean
}

// TODO (backend): load these from a DeliverySlot table so the owner can edit them in Settings.
export const DELIVERY_SLOTS: DeliverySlot[] = [
  { key: 'morning', label: 'Morning', hours: '9:00 AM – 1:00 PM', startHour: 9, extraFee: 0 },
  { key: 'afternoon', label: 'Afternoon', hours: '2:00 PM – 6:00 PM', startHour: 14, extraFee: 0 },
  { key: 'evening', label: 'Evening', hours: '6:00 PM – 9:00 PM', startHour: 18, extraFee: 0 },
  { key: 'midnight', label: 'Midnight Surprise', hours: '11:45 PM – 12:15 AM', startHour: 23, extraFee: 1000, sameDayZonesOnly: true },
]

export const SLOT_LABEL: Record<DeliverySlotKey, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  midnight: 'Midnight Surprise',
}

export const SLOT_BY_KEY = Object.fromEntries(DELIVERY_SLOTS.map((s) => [s.key, s])) as Record<DeliverySlotKey, DeliverySlot>

function minutesNow(now: Date) {
  return colomboMinutes(now)
}

function cutoffMinutes(cutoff: string) {
  const [h, m] = cutoff.split(':').map(Number)
  return h * 60 + (m || 0)
}

/** The first date a customer can choose for this zone. */
export function earliestDeliveryDate(zone: DeliveryZone | undefined, cutoff: string, now = new Date()): string {
  if (!zone) return isoDate(1, now)
  if (zone.sameDay && minutesNow(now) < cutoffMinutes(cutoff)) return isoDate(0, now)
  return zone.sameDay ? isoDate(1, now) : isoDate(2, now)
}

/** Slots that can still be delivered on the chosen date. */
export function availableSlots(date: string, zone: DeliveryZone | undefined, now = new Date()): DeliverySlot[] {
  return DELIVERY_SLOTS.filter((slot) => {
    if (slot.sameDayZonesOnly && !zone?.sameDay) return false
    if (date === isoDate(0, now)) return slot.startHour * 60 - 120 > minutesNow(now)
    return true
  })
}
