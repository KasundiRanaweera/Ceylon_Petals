// When a guest places an order the server returns a private "access token" for that one order.
// We keep it for this browser tab only (sessionStorage), and send it back when the confirmation
// or payment page asks for the order. Closing the tab forgets it: after that, guests use
// "Track order" (order number + phone number) instead.
const KEY = 'ceylon-petals-order-tokens'

function read(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? '{}') as Record<string, string>
  } catch {
    return {}
  }
}

const normalise = (orderNumber: string) => orderNumber.trim().toUpperCase()

export function saveOrderToken(orderNumber: string, token: string) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...read(), [normalise(orderNumber)]: token }))
  } catch {
    // Private mode: the confirmation page falls back to the track-order form.
  }
}

/** The header to send with a request about this order (empty when we have no token). */
export function orderTokenHeader(orderNumber: string): Record<string, string> {
  const token = read()[normalise(orderNumber)]
  return token ? { 'X-Order-Token': token } : {}
}
