import { describe, expect, it } from 'vitest'
import { addDays, colomboNow } from '../lib/colomboTime.js'
import { availableSlots, earliestDeliveryDate, fromDbSlot, toDbSlot } from '../lib/deliverySlots.js'
import { applyPromo, deliveryFeeFor, effectivePrice } from '../lib/pricing.js'
import { priceHamper } from '../lib/hamper.js'
import { signAuthToken, signOrderToken, verifyAuthToken, verifyOrderToken } from '../lib/tokens.js'
import { parseOrderNumber } from '../services/orders.js'

// Colombo is UTC+5:30. 2026-10-20T03:00:00Z is 08:30 on the 20th in Colombo.
const at = (iso: string) => new Date(iso)

describe('Colombo time', () => {
  it('converts from UTC', () => {
    expect(colomboNow(at('2026-10-20T03:00:00Z'))).toEqual({ date: '2026-10-20', minutes: 8 * 60 + 30 })
  })
  it('rolls over to the next day (the server runs in UTC, Sri Lanka is already tomorrow)', () => {
    // 20:00 UTC on the 20th = 01:30 on the 21st in Colombo.
    expect(colomboNow(at('2026-10-20T20:00:00Z'))).toEqual({ date: '2026-10-21', minutes: 90 })
  })
  it('shows midnight as 00:00, not 24:00', () => {
    expect(colomboNow(at('2026-10-20T18:30:00Z'))).toEqual({ date: '2026-10-21', minutes: 0 })
  })
  it('adds days across month ends', () => {
    expect(addDays('2026-10-30', 3)).toBe('2026-11-02')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })
})

describe('earliest delivery date', () => {
  const sameDay = { sameDay: true }
  const farZone = { sameDay: false }
  it('same-day zone before the cut-off: today', () => {
    expect(earliestDeliveryDate(sameDay, '14:00', at('2026-10-20T03:00:00Z'))).toBe('2026-10-20') // 08:30
  })
  it('same-day zone after the cut-off: tomorrow', () => {
    expect(earliestDeliveryDate(sameDay, '14:00', at('2026-10-20T09:30:00Z'))).toBe('2026-10-21') // 15:00
  })
  it('exactly at the cut-off is already too late', () => {
    expect(earliestDeliveryDate(sameDay, '14:00', at('2026-10-20T08:30:00Z'))).toBe('2026-10-21') // 14:00
  })
  it('other zones: the day after tomorrow', () => {
    expect(earliestDeliveryDate(farZone, '14:00', at('2026-10-20T03:00:00Z'))).toBe('2026-10-22')
  })
  it('uses Colombo "today", not the UTC date', () => {
    // 20:00 UTC on the 20th is already the 21st in Colombo, 01:30, before the cut-off.
    expect(earliestDeliveryDate(sameDay, '14:00', at('2026-10-20T20:00:00Z'))).toBe('2026-10-21')
  })
})

describe('delivery slots', () => {
  const keys = (date: string, zone: { sameDay: boolean }, now: string) => availableSlots(date, zone, at(now)).map((s) => s.key)

  it('offers every slot on a future date in a same-day zone', () => {
    expect(keys('2026-10-25', { sameDay: true }, '2026-10-20T03:00:00Z')).toEqual(['morning', 'afternoon', 'evening', 'midnight'])
  })
  it('closes slots two hours before they start, for today', () => {
    // 08:30 in Colombo: morning (9:00) closed at 07:00; afternoon (14:00) closes at 12:00.
    expect(keys('2026-10-20', { sameDay: true }, '2026-10-20T03:00:00Z')).toEqual(['afternoon', 'evening', 'midnight'])
    // 13:00: afternoon closed, evening (closes 16:00) still open.
    expect(keys('2026-10-20', { sameDay: true }, '2026-10-20T07:30:00Z')).toEqual(['evening', 'midnight'])
  })
  it('midnight delivery is only for same-day zones', () => {
    expect(keys('2026-10-25', { sameDay: false }, '2026-10-20T03:00:00Z')).toEqual(['morning', 'afternoon', 'evening'])
  })
  it('maps to and from the database enum', () => {
    expect(toDbSlot('midnight')).toBe('MIDNIGHT')
    expect(fromDbSlot('AFTERNOON')).toBe('afternoon')
  })
})

describe('prices', () => {
  it('uses the sale price only when it is really lower', () => {
    expect(effectivePrice({ price: 15000, discountPrice: 13800 })).toBe(13800)
    expect(effectivePrice({ price: 15000, discountPrice: null })).toBe(15000)
    expect(effectivePrice({ price: 15000 })).toBe(15000)
    expect(effectivePrice({ price: 15000, discountPrice: 16000 })).toBe(15000)
  })

  it('delivery is free from the threshold upwards (and never free when the threshold is 0)', () => {
    expect(deliveryFeeFor({ fee: 500 }, 24999, 25000)).toBe(500)
    expect(deliveryFeeFor({ fee: 500 }, 25000, 25000)).toBe(0)
    expect(deliveryFeeFor({ fee: 500 }, 999999, 0)).toBe(500)
  })
})

describe('promo codes', () => {
  const percent = { code: 'WELCOME10', type: 'PERCENT' as const, value: 10, minOrder: 10000, active: true }
  const fixed = { code: 'AVURUDU1000', type: 'FIXED' as const, value: 1000, minOrder: 15000, active: true }

  it('applies a percentage, rounded to the rupee', () => {
    expect(applyPromo(percent, 15200)).toEqual({ ok: true, discount: 1520 })
    expect(applyPromo(percent, 12345)).toEqual({ ok: true, discount: 1235 })
  })
  it('applies a fixed amount', () => {
    expect(applyPromo(fixed, 20000)).toEqual({ ok: true, discount: 1000 })
  })
  it('never discounts more than the goods cost', () => {
    expect(applyPromo({ ...fixed, minOrder: 0, value: 5000 }, 3000)).toEqual({ ok: true, discount: 3000 })
  })
  it('rejects unknown, switched-off and too-small orders', () => {
    expect(applyPromo(null, 20000)).toMatchObject({ ok: false, error: 'This promo code is not valid.' })
    expect(applyPromo({ ...percent, active: false }, 20000)).toMatchObject({ ok: false })
    const small = applyPromo(percent, 9999)
    expect(small).toMatchObject({ ok: false })
    expect((small as { error: string }).error).toMatch(/at least Rs\. 10,000/)
  })
})

describe('custom hampers (priced by the server)', () => {
  it('adds up the base, treats and keepsake', () => {
    const hamper = priceHamper({ base: 'roses', treats: ['pralines', 'macarons'], keepsake: 'teacaddy' })
    expect(hamper.unitPrice).toBe(12000 + 7500 + 6800 + 9500)
    expect(hamper.options).toBe('Highland Roses + Swiss Chocolate Pralines (16 pcs) + French Macarons Box (10 pcs) + Single Estate Tea in Brass Caddy')
    expect(hamper.name).toBe('Custom-built hamper')
  })
  it('treats and keepsake are optional, and repeated treats count once', () => {
    expect(priceHamper({ base: 'pastel', treats: [] }).unitPrice).toBe(9500)
    expect(priceHamper({ base: 'pastel', treats: ['pralines', 'pralines'], keepsake: null }).unitPrice).toBe(9500 + 7500)
  })
  it('rejects options that do not exist', () => {
    expect(() => priceHamper({ base: 'gold-bars', treats: [] })).toThrow(/unknown flower base/)
    expect(() => priceHamper({ base: 'roses', treats: ['caviar'] })).toThrow(/unknown treat/)
    expect(() => priceHamper({ base: 'roses', treats: [], keepsake: 'yacht' })).toThrow(/unknown keepsake/)
  })
})

describe('order numbers and tokens', () => {
  it('understands every way a customer might type an order number', () => {
    for (const text of ['CP-1049', 'cp-1049', ' #1049 ', '1049', '#CP-1049']) expect(parseOrderNumber(text), text).toBe(1049)
    for (const text of ['', 'abc', 'CP-', '10 49', "1049'; drop table", '1234567890123']) expect(parseOrderNumber(text), text).toBeNull()
  })

  it('an order token works for that order only', () => {
    const token = signOrderToken(1049)
    expect(verifyOrderToken(token, 1049)).toBe(true)
    expect(verifyOrderToken(token, 1050)).toBe(false)
    expect(verifyOrderToken('garbage', 1049)).toBe(false)
  })

  it('an order token cannot be used as a login token, and the other way round', () => {
    expect(verifyAuthToken(signOrderToken(1049))).toBeNull()
    expect(verifyOrderToken(signAuthToken({ id: 'user-1', tokenVersion: 0 }), 1049)).toBe(false)
  })
})
