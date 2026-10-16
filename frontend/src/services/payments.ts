import { post } from '../lib/api'
import { orderTokenHeader } from '../lib/orderTokens'
import type { AdminOrder } from '../types/admin'

// Card payments through PayHere. The browser never tells the server "I paid": PayHere's own
// servers do, with a signature. These calls only start the payment.

export type PaymentStart =
  | { mode: 'simulated' }
  | { mode: 'sandbox' | 'live'; action: string; method: 'POST'; fields: Record<string, string> }

/** Asks the server for the signed PayHere form (or "simulated" while developing). */
export function startCardPayment(orderNumber: string): Promise<PaymentStart> {
  return post<PaymentStart>('/payments/payhere/start', { orderNumber }, orderTokenHeader(orderNumber))
}

/** Development only (PAYHERE_MODE=simulated): the server answers 404 anywhere else. */
export function simulateCardPayment(orderNumber: string, outcome: 'success' | 'failed' | 'cancelled'): Promise<AdminOrder> {
  return post<AdminOrder>('/payments/dev/simulate', { orderNumber, outcome }, orderTokenHeader(orderNumber))
}

/** Sends the customer to PayHere's hosted page by submitting the signed fields as a form. */
export function redirectToPayHere(start: Extract<PaymentStart, { action: string }>) {
  const form = document.createElement('form')
  form.method = start.method
  form.action = start.action
  for (const [name, value] of Object.entries(start.fields)) {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = value
    form.appendChild(input)
  }
  document.body.appendChild(form)
  form.submit()
}
