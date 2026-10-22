// Phone numbers are stored as digits in international format without "+", e.g. 94771234567,
// which is exactly what wa.me links need. Customers can type them however they like.

function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (digits.length === 10 && digits.startsWith('0')) return `94${digits.slice(1)}` // 077 123 4567
  if (digits.length === 9 && digits.startsWith('7')) return `94${digits}` // 77 123 4567
  return digits.replace(/^00/, '') // 0044... → 44...
}

/** Accepts Sri Lankan numbers and overseas numbers (for customers ordering from abroad). */
export function isValidPhone(input: string): boolean {
  const n = normalizePhone(input)
  if (n.startsWith('94')) return n.length === 11
  return n.length >= 8 && n.length <= 15
}

export function formatPhone(stored: string): string {
  if (stored.startsWith('94') && stored.length === 11) {
    return `+94 ${stored.slice(2, 4)} ${stored.slice(4, 7)} ${stored.slice(7)}`
  }
  return `+${stored}`
}

