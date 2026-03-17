"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/utils/query-keys"

interface PaymentStats {
  pendingBankTransfers: number
  totalCompleted: number
  totalFailed: number
  totalPending: number
}

export function usePaymentStatsQuery() {
  return useQuery({
    queryKey: queryKeys.admin.paymentStats(),
    queryFn: async (): Promise<PaymentStats> => {
      const response = await fetch("/api/admin/payments/stats")

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to fetch payment stats"
        throw new Error(message)
      }

      const body = await response.json()
      return body.data as PaymentStats
    },
    staleTime: 60_000,
  })
}
