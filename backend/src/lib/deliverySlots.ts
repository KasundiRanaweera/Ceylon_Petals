import { addDays, clockToMinutes, colomboNow } from './colomboTime.js'

// Delivery time slots and the rules about when an order can arrive.
// Same rules as frontend/src/lib/deliverySlots.ts, so the page and the server always agree.
// TODO: move slot hours and fees into a database table so the owner can edit them in Settings.

export type SlotKey = 'morning' | 'afternoon' | 'evening' | 'midnight'
export type DbSlot = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'MIDNIGHT'

export interface SlotDef {
  key: SlotKey
  label: string
  hours: string
  /** Hour the slot starts (24h). Same-day slots close 2 hours before this. */
  startHour: number
  extraFee: number
  /** Midnight deliveries need our own van, so they are only offered in same-day zones. */
  sameDayZonesOnly?: boolean
}

const DELIVERY_SLOTS: SlotDef[] = [
  { key: 'morning', label: 'Morning', hours: '9:00 AM – 1:00 PM', startHour: 9, extraFee: 0 },
  { key: 'afternoon', label: 'Afternoon', hours: '2:00 PM – 6:00 PM', startHour: 14, extraFee: 0 },
  { key: 'evening', label: 'Evening', hours: '6:00 PM – 9:00 PM', startHour: 18, extraFee: 0 },
  { key: 'midnight', label: 'Midnight Surprise', hours: '11:45 PM – 12:15 AM', startHour: 23, extraFee: 1000, sameDayZonesOnly: true },
]

export const SLOT_KEYS = DELIVERY_SLOTS.map((s) => s.key) as [SlotKey, ...SlotKey[]]
export const slotByKey = (key: SlotKey): SlotDef => DELIVERY_SLOTS.find((s) => s.key === key)!

export const toDbSlot = (key: SlotKey): DbSlot => key.toUpperCase() as DbSlot
export const fromDbSlot = (slot: DbSlot): SlotKey => slot.toLowerCase() as SlotKey

/** How many days ahead an order may be placed. Bigger events go through the custom order form. */
export const MAX_DAYS_AHEAD = 120

/**
 * The first date a customer can choose.
 *  - same-day zone and before the cut-off: today
 *  - same-day zone, after the cut-off:     tomorrow
 *  - other zones:                          the day after tomorrow
 */
export function earliestDeliveryDate(zone: { sameDay: boolean } | undefined, cutoff: string, now: Date = new Date()): string {
  const today = colomboNow(now)
  if (!zone) return addDays(today.date, 1)
  if (zone.sameDay && today.minutes < clockToMinutes(cutoff)) return today.date
  return addDays(today.date, zone.sameDay ? 1 : 2)
}

/** Slots that can still be delivered on the chosen date. */
export function availableSlots(date: string, zone: { sameDay: boolean } | undefined, now: Date = new Date()): SlotDef[] {
  const today = colomboNow(now)
  return DELIVERY_SLOTS.filter((slot) => {
    if (slot.sameDayZonesOnly && !zone?.sameDay) return false
    if (date === today.date) return slot.startHour * 60 - 120 > today.minutes
    return true
  })
}
