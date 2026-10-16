import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CreditCard, Lock, ShieldAlert } from 'lucide-react'
import NotFound from './NotFound'
import { FormError } from '../components/ui/Field'
import { getOrderByNumber } from '../services/orders'
import { redirectToPayHere, simulateCardPayment, startCardPayment } from '../services/payments'
import { formatLKR } from '../lib/format'
import { useShop } from '../hooks/useShop'

// Paying an order by card.
//
//   1. "Pay securely" asks the server for the signed PayHere form (POST /api/payments/payhere/start).
//   2. The browser sends that form to PayHere's hosted page, where the customer enters the card.
//   3. PayHere tells OUR SERVER the result (the browser is never trusted to say "I paid").
//   4. PayHere sends the customer back to /order-confirmation/:orderNumber.
//
// While developing (PAYHERE_MODE=simulated on the server) step 2 is replaced by two test buttons.
export default function PayHerePayment() {
  const { orderNumber = '' } = useParams<{ orderNumber: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { shopName } = useShop()
  const { data: order, isLoading } = useQuery({ queryKey: ['order', orderNumber], queryFn: () => getOrderByNumber(orderNumber) })
  const [simulated, setSimulated] = useState(false)

  const finish = () => {
    queryClient.invalidateQueries({ queryKey: ['order', orderNumber] })
    queryClient.invalidateQueries({ queryKey: ['admin'] })
    queryClient.invalidateQueries({ queryKey: ['me'] })
    queryClient.invalidateQueries({ queryKey: ['products'] })
    navigate(`/order-confirmation/${orderNumber}`, { replace: true })
  }

  const start = useMutation({
    mutationFn: () => startCardPayment(orderNumber),
    onSuccess: (result) => {
      if (result.mode === 'simulated') setSimulated(true)
      else redirectToPayHere(result)
    },
  })

  const simulate = useMutation({
    mutationFn: (outcome: 'success' | 'failed') => simulateCardPayment(orderNumber, outcome),
    onSuccess: finish,
  })

  // Nothing to pay: send them to the confirmation page.
  const alreadyPaid = order?.paymentStatus === 'PAID'
  useEffect(() => {
    if (alreadyPaid) navigate(`/order-confirmation/${orderNumber}`, { replace: true })
  }, [alreadyPaid, navigate, orderNumber])

  if (isLoading) return <div className="min-h-[60vh]" aria-busy="true" />
  if (!order || order.paymentMethod !== 'CARD') return <NotFound />

  const busy = start.isPending || simulate.isPending
  const error = start.error ?? simulate.error

  return (
    <section className="max-w-lg mx-auto px-4 py-14">
      <div className="bg-surface-container-lowest rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-[#0b2a4a] text-white px-6 py-4 flex items-center justify-between">
          <span className="font-bold tracking-wide">PayHere</span>
          <span className="flex items-center gap-1 text-[12px] opacity-80"><Lock size={13} /> Secure payment</span>
        </div>
        <div className="p-6 space-y-5">
          {simulated && (
            <div className="flex items-start gap-3 bg-tertiary-fixed/60 text-on-tertiary-fixed rounded-lg p-3 text-body-sm">
              <ShieldAlert size={18} className="shrink-0 mt-0.5" />
              <span>
                <strong>Test mode.</strong> The server is running without a real PayHere account, so no card is charged. Choose how this payment should end.
              </span>
            </div>
          )}
          <div className="text-center space-y-1">
            <p className="text-body-sm text-secondary">Paying {shopName}</p>
            <p className="font-display text-display-lg text-primary">{formatLKR(order.total)}</p>
            <p className="text-body-sm text-secondary">Order {order.orderNumber}</p>
          </div>

          <FormError message={error ? error.message : null} />

          {simulated ? (
            <>
              <button
                type="button"
                onClick={() => simulate.mutate('success')}
                disabled={busy}
                className="w-full bg-[#0b2a4a] text-white text-title-md py-3.5 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60"
              >
                <CreditCard size={18} /> {simulate.isPending ? 'Processing…' : 'Simulate successful payment'}
              </button>
              <button
                type="button"
                onClick={() => simulate.mutate('failed')}
                disabled={busy}
                className="w-full bg-surface-container text-on-surface text-title-md py-3 rounded-lg hover:bg-surface-container-high disabled:opacity-60"
              >
                Simulate failed / cancelled payment
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => start.mutate()}
              disabled={busy}
              className="w-full bg-[#0b2a4a] text-white text-title-md py-3.5 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60"
            >
              <CreditCard size={18} /> {start.isPending ? 'Opening PayHere…' : `Pay ${formatLKR(order.total)} securely`}
            </button>
          )}
          <p className="text-body-sm text-secondary text-center">You'll enter your card details on PayHere's secure page. We never see or store them.</p>
        </div>
      </div>
    </section>
  )
}
