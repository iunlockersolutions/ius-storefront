"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { invalidateMutationCaches } from "@/lib/utils/query-invalidation-map"
import { queryKeys } from "@/lib/utils/query-keys"

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

export function useStartOrderPackingMutation(orderId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload?: { notes?: string }) => {
      const response = await fetch(
        `/api/admin/orders/${orderId}/packing/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload ?? {}),
        },
      )

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to start packing"
        throw new Error(message)
      }

      return response.json()
    },
    onSuccess: async () => {
      await invalidateMutationCaches(queryClient, "order.updateStatus", {
        orderId,
      })
      await queryClient.invalidateQueries({
        queryKey: queryKeys.admin.inventoryRoot(),
      })
    },
  })
}

export function useScanOrderPackingUnitMutation(orderId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      orderItemId: string
      identifier: string
    }) => {
      const response = await fetch(
        `/api/admin/orders/${orderId}/packing/scan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      )

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to scan serialized unit"
        throw new Error(message)
      }

      return response.json()
    },
    onSuccess: async () => {
      await invalidateMutationCaches(queryClient, "order.updateStatus", {
        orderId,
      })
      await queryClient.invalidateQueries({
        queryKey: queryKeys.admin.inventoryRoot(),
      })
    },
  })
}

export function useUnassignOrderPackingUnitMutation(orderId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      orderItemId: string
      inventoryUnitId: string
    }) => {
      const response = await fetch(
        `/api/admin/orders/${orderId}/packing/unassign`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      )

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to unassign serialized unit"
        throw new Error(message)
      }

      return response.json()
    },
    onSuccess: async () => {
      await invalidateMutationCaches(queryClient, "order.updateStatus", {
        orderId,
      })
      await queryClient.invalidateQueries({
        queryKey: queryKeys.admin.inventoryRoot(),
      })
    },
  })
}

export function useCompleteOrderPackingMutation(orderId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload?: {
      notes?: string
      carrier?: string
      trackingNumber?: string
      trackingUrl?: string
    }) => {
      const response = await fetch(
        `/api/admin/orders/${orderId}/packing/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload ?? {}),
        },
      )

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to complete packing"
        throw new Error(message)
      }

      return response.json()
    },
    onSuccess: async () => {
      await invalidateMutationCaches(queryClient, "order.updateStatus", {
        orderId,
      })
      await queryClient.invalidateQueries({
        queryKey: queryKeys.admin.inventoryRoot(),
      })
    },
  })
}

export function useCancelOrderMutation(orderId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      reason: string
      idempotencyKey?: string
    }) => {
      const response = await fetch(`/api/admin/orders/${orderId}/cancel`, {
        method: "POST",
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
          "Failed to cancel order"
        throw new Error(message)
      }

      return response.json()
    },
    onSuccess: async () => {
      await invalidateMutationCaches(queryClient, "order.updateStatus", {
        orderId,
      })
      await queryClient.invalidateQueries({
        queryKey: queryKeys.admin.inventoryRoot(),
      })
    },
  })
}

export function useRefundOrderMutation(orderId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      reason: string
      idempotencyKey?: string
      lineDispositions: Array<{
        orderItemId: string
        disposition: "restock" | "damaged" | "lost" | "no-return"
        quantity?: number
      }>
    }) => {
      const response = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: "POST",
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
          "Failed to refund order"
        throw new Error(message)
      }

      return response.json()
    },
    onSuccess: async () => {
      await invalidateMutationCaches(queryClient, "order.updateStatus", {
        orderId,
      })
      await queryClient.invalidateQueries({
        queryKey: queryKeys.admin.inventoryRoot(),
      })
    },
  })
}
