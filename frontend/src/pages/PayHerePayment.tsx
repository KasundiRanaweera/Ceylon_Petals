import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CreditCard, Lock, ShieldAlert } from 'lucide-react'
import NotFound from './NotFound'
import { getOrderByNumber, recordCardPayment } from '../services/orders'
import { formatLKR } from '../lib/format'
import { useShop } from '../hooks/useShop'

// Stand-in for the PayHere hosted checkout while there is no backend.
//
// TODO (backend): replace this page. The real flow is:
//   1. POST /api/payments/payhere/start { orderNumber } → server returns the signed PayHere form fields (hash)
//   2. The browser auto-submits that form to https://sandbox.payhere.lk/pay/checkout
//   3. PayHere calls POST /api/payments/payhere/notify → server checks md5sig and marks the order PAID/FAILED
//   4. PayHere sends the customer back to return_url = /order-confirmation/:orderNumber
export default function PayHerePayment() {
  const { orderNumber = '' } = useParams<{ orderNumber: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { shopName } = useShop()
  const { data: order, isLoading } = useQuery({ queryKey: ['order', orderNumber], queryFn: () => getOrderByNumber(orderNumber) })

  const pay = useMutation({
    mutationFn: (success: boolean) => recordCardPayment(orderNumber, success),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderNumber] })
      queryClient.invalidateQueries({ queryKey: ['admin'] })
      queryClient.invalidateQueries({ queryKey: ['me'] })
      navigate(`/order-confirmation/${orderNumber}`, { replace: true })
    },
  })

  if (isLoading) return <div className="min-h-[60vh]" aria-busy="true" />
  if (!order || order.paymentMethod !== 'CARD') return <NotFound />

  return (
    <section className="max-w-lg mx-auto px-4 py-14">
      <div className="bg-surface-container-lowest rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-[#0b2a4a] text-white px-6 py-4 flex items-center justify-between">
          <span className="font-bold tracking-wide">PayHere</span>
          <span className="flex items-center gap-1 text-[12px] opacity-80"><Lock size={13} /> Secure payment</span>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-start gap-3 bg-tertiary-fixed/60 text-on-tertiary-fixed rounded-lg p-3 text-body-sm">
            <ShieldAlert size={18} className="shrink-0 mt-0.5" />
            <span>
              <strong>Test mode.</strong> The real PayHere checkout will open here once the backend is connected. No card details are collected on this page.
            </span>
          </div>
          <div className="text-center space-y-1">
            <p className="text-body-sm text-secondary">Paying {shopName}</p>
            <p className="font-display text-display-lg text-primary">{formatLKR(order.total)}</p>
            <p className="text-body-sm text-secondary">Order {order.orderNumber}</p>
          </div>
          <button
            type="button"
            onClick={() => pay.mutate(true)}
            disabled={pay.isPending}
            className="w-full bg-[#0b2a4a] text-white text-title-md py-3.5 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60"
          >
            <CreditCard size={18} /> {pay.isPending ? 'Processing…' : 'Simulate successful payment'}
          </button>
          <button
            type="button"
            onClick={() => pay.mutate(false)}
            disabled={pay.isPending}
            className="w-full bg-surface-container text-on-surface text-title-md py-3 rounded-lg hover:bg-surface-container-high disabled:opacity-60"
          >
            Simulate failed / cancelled payment
          </button>
        </div>
      </div>
    </section>
  )
}
