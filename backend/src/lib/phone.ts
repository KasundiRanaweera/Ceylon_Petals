// Phone numbers are stored as digits in international format without "+", e.g. 94771234567,
// which is what wa.me links need. Customers can type them however they like.
// This is the same logic as frontend/src/lib/phone.ts, so the API accepts what the form accepts.

export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (digits.length === 10 && digits.startsWith('0')) return `94${digits.slice(1)}` // 077 123 4567
  if (digits.length === 9 && digits.startsWith('7')) return `94${digits}` // 77 123 4567
  return digits.replace(/^00/, '') // 0044... -> 44...
}

/** Sri Lankan numbers, plus overseas numbers (customers often order from abroad). */
export function isValidPhone(input: string): boolean {
  const n = normalizePhone(input)
  if (n.startsWith('94')) return n.length === 11
  return n.length >= 8 && n.length <= 15
}

/** Compare two numbers loosely (last 9 digits), so "0771234567" matches "+94 77 123 4567". */
export function samePhone(a: string, b: string): boolean {
  return normalizePhone(a).slice(-9) === normalizePhone(b).slice(-9)
}
