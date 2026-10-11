import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminListOrders, updateOrderStatus, updatePaymentStatus } from '../services/orders'
import { adminListProducts } from '../services/catalog'
import type { OrderStatus, PaymentStatus } from '../types/admin'

// Shared queries for the owner pages. Every admin key starts with 'admin', so one
// invalidate refreshes the whole console after the storefront changes something.

export function useAdminOrders() {
  return useQuery({ queryKey: ['admin', 'orders'], queryFn: adminListOrders })
}

export function useAdminProducts() {
  return useQuery({ queryKey: ['admin', 'products'], queryFn: adminListProducts })
}

export function useOrderMutations() {
  const queryClient = useQueryClient()
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin'] })
    // Stock changes when an order is cancelled or re-opened.
    queryClient.invalidateQueries({ queryKey: ['products'] })
  }
  const status = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => updateOrderStatus(id, status),
    onSuccess: refresh,
  })
  const payment = useMutation({
    mutationFn: ({ id, paymentStatus }: { id: string; paymentStatus: PaymentStatus }) => updatePaymentStatus(id, paymentStatus),
    onSuccess: refresh,
  })
  return { status, payment }
}
