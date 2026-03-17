"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { invalidateMutationCaches } from "@/lib/utils/query-invalidation-map"

export function useVerifyBankTransferMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      paymentId: string
      approved: boolean
      notes?: string
      orderId?: string
    }) => {
      const response = await fetch(
        `/api/admin/payments/${payload.paymentId}/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            approved: payload.approved,
            notes: payload.notes,
          }),
        },
      )

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to verify bank transfer"
        throw new Error(message)
      }

      return response.json()
    },
    onSuccess: (_data, variables) => {
      invalidateMutationCaches(queryClient, "payment.verifyBankTransfer", {
        orderId: variables.orderId,
      })
    },
  })
}
