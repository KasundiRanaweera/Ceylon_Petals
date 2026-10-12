import { useState } from 'react'
import ConfirmDialog from '../../ui/ConfirmDialog'
import { useToast } from '../../../hooks/useToast'
import { useOrderMutations } from '../../../hooks/useAdminData'
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from '../../../lib/orderStatus'
import type { AdminOrder, OrderStatus, PaymentStatus } from '../../../types/admin'

// The rules for changing an order, shared by the Orders board/table and the Order detail page:
//  - cancelling asks first (it can't be undone, and stock goes back on the shelf)
//  - delivering an unpaid cash/WhatsApp order reminds the owner to collect the money
//  - cancelling a paid order reminds the owner to refund it
export function useOrderStatusFlow() {
  const { showToast } = useToast()
  const { status, payment } = useOrderMutations()
  const [pendingCancel, setPendingCancel] = useState<AdminOrder | null>(null)

  function apply(order: AdminOrder, next: OrderStatus, after?: () => void) {
    status.mutate(
      { id: order.id, status: next },
      {
        onSuccess: () => {
          showToast(`${order.orderNumber} is now ${ORDER_STATUS_LABEL[next]}`)
          after?.()
        },
        onError: (err) => showToast(err.message, 'error'),
      }
    )
  }

  function changeStatus(order: AdminOrder, next: OrderStatus) {
    if (next === order.status) return
    if (next === 'CANCELLED') {
      setPendingCancel(order)
      return
    }
    apply(order, next, () => {
      if (next === 'DELIVERED' && order.paymentMethod !== 'CARD' && order.paymentStatus === 'PENDING') {
        showToast(`${order.orderNumber} was unpaid. Mark it as paid once you have collected the money.`, 'info')
      }
    })
  }

  function changePayment(order: AdminOrder, paymentStatus: PaymentStatus) {
    payment.mutate(
      { id: order.id, paymentStatus },
      {
        onSuccess: () => showToast(`${order.orderNumber} payment marked as ${PAYMENT_STATUS_LABEL[paymentStatus].toLowerCase()}`),
        onError: (err) => showToast(err.message, 'error'),
      }
    )
  }

  function confirmCancel() {
    if (!pendingCancel) return
    const order = pendingCancel
    setPendingCancel(null)
    apply(order, 'CANCELLED', () => {
      if (order.paymentStatus === 'PAID') {
        showToast('This order was paid. Refund the customer, then mark the payment as refunded.', 'info')
      }
    })
  }

  const cancelDialog = (
    <ConfirmDialog
      open={pendingCancel !== null}
      title={`Cancel order ${pendingCancel?.orderNumber ?? ''}?`}
      message={
        pendingCancel?.paymentStatus === 'PAID'
          ? 'The customer has already paid for this order. Cancelling does not refund them automatically, so you will need to refund them yourself.'
          : 'The customer will not receive this order. You can message them on WhatsApp to explain.'
      }
      confirmLabel="Yes, cancel order"
      cancelLabel="Keep order"
      tone="danger"
      onConfirm={confirmCancel}
      onCancel={() => setPendingCancel(null)}
    />
  )

  return { changeStatus, changePayment, cancelDialog, busy: status.isPending || payment.isPending }
}
