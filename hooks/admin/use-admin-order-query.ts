"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/utils/query-keys"

export interface AdminOrder {
  id: string
  orderNumber: string
  status: string
  subtotal: string
  taxAmount: string
  shippingCost: string
  discountAmount: string
  total: string
  notes: string | null
  adminNotes: string | null
  customerEmail: string
  customerPhone: string | null
  customerName: string | null
  shippingAddress: {
    recipientName: string
    phone: string
    addressLine1: string
    addressLine2?: string
    city: string
    state?: string
    postalCode: string
    country: string
    instructions?: string
  } | null
  billingAddress: {
    recipientName: string
    phone: string
    addressLine1: string
    addressLine2?: string
    city: string
    state?: string
    postalCode: string
    country: string
  } | null
  createdAt: string | Date
  updatedAt: string | Date
  customer: {
    id: string | null
    name: string | null
    email: string | null
  } | null
  items: Array<{
    id: string
    quantity: number
    unitPrice: string
    subtotal: string
    productName: string
    variantName: string
    sku: string
    variant: {
      id: string | null
      name: string | null
      sku: string | null
    } | null
  }>
  statusHistory: Array<{
    id: string
    fromStatus: string | null
    toStatus: string
    notes: string | null
    createdAt: string | Date
    changedBy: {
      id: string | null
      name: string | null
      email: string | null
    } | null
  }>
}

export function useAdminOrderQuery(orderId: string) {
  return useQuery({
    queryKey: queryKeys.admin.order(orderId),
    queryFn: async (): Promise<AdminOrder> => {
      const response = await fetch(`/api/admin/orders/${orderId}`)

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to fetch order"
        throw new Error(message)
      }

      const body = await response.json()
      return body.data as AdminOrder
    },
    enabled: Boolean(orderId),
    retry: 2,
    staleTime: 60_000,
  })
}
