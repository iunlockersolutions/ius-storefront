"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { invalidateMutationCaches } from "@/lib/utils/query-invalidation-map"

export function useReceiveInventoryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      variantId: string
      locationId?: string
      quantity?: number
      notes?: string
      units?: Array<{
        notes?: string
        identifiers: Array<{
          type: "serial" | "imei" | "imei2" | "barcode"
          value: string
        }>
      }>
    }) => {
      const response = await fetch(`/api/admin/inventory/receipts`, {
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
          "Failed to receive inventory"
        throw new Error(message)
      }

      const body = await response.json()
      return body.data as {
        success: true
        trackingMode: "quantity" | "serial"
        receivedQuantity: number
        previousQuantity: number
        newQuantity: number
      }
    },
    onSuccess: (_data, variables) => {
      void invalidateMutationCaches(queryClient, "inventory.receive", {
        variantId: variables.variantId,
      })
    },
  })
}

export function useAdjustStockMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      variantId: string
      adjustment: number
      reason: string
    }) => {
      const response = await fetch(
        `/api/admin/inventory/${payload.variantId}/adjust`,
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
    onSuccess: (_data, variables) => {
      void invalidateMutationCaches(queryClient, "inventory.adjust", {
        variantId: variables.variantId,
      })
    },
  })
}

export function useUpdateLowStockThresholdMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: { variantId: string; threshold: number }) => {
      const response = await fetch(
        `/api/admin/inventory/${payload.variantId}/threshold`,
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
    onSuccess: (_data, variables) => {
      void invalidateMutationCaches(queryClient, "inventory.updateThreshold", {
        variantId: variables.variantId,
      })
    },
  })
}
