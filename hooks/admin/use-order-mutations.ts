"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { invalidateMutationCaches } from "@/lib/utils/query-invalidation-map"

type OrderStatus =
  | "draft"
  | "pending_payment"
  | "paid"
  | "processing"
  | "packing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"

export function useUpdateOrderStatusMutation(orderId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: { status: OrderStatus; notes?: string }) => {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to update order status"
        throw new Error(message)
      }

      return response.json()
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "order.updateStatus", {
        orderId,
      })
    },
  })
}

export function useUpdateOrderNotesMutation(orderId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (adminNotes: string) => {
      const response = await fetch(`/api/admin/orders/${orderId}/notes`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminNotes }),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to update order notes"
        throw new Error(message)
      }

      return response.json()
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "order.updateNotes", {
        orderId,
      })
    },
  })
}
