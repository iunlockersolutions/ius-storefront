"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { invalidateMutationCaches } from "@/lib/utils/query-invalidation-map"

export function useAdjustStockMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      inventoryItemId: string
      adjustment: number
      reason: string
    }) => {
      const response = await fetch(
        `/api/admin/inventory/${payload.inventoryItemId}/adjust`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            adjustment: payload.adjustment,
            reason: payload.reason,
          }),
        },
      )

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to adjust stock"
        throw new Error(message)
      }

      const body = await response.json()
      return body.data as {
        success: true
        previousQuantity: number
        newQuantity: number
      }
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "inventory.adjust")
    },
  })
}

export function useUpdateLowStockThresholdMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      inventoryItemId: string
      threshold: number
    }) => {
      const response = await fetch(
        `/api/admin/inventory/${payload.inventoryItemId}/threshold`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ threshold: payload.threshold }),
        },
      )

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to update threshold"
        throw new Error(message)
      }

      const body = await response.json()
      return body.data as { success: true }
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "inventory.updateThreshold")
    },
  })
}
