"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/utils/query-keys"
import type { AdminInstallmentOffer } from "@/services/queries/use-admin-installment-plans-query"

async function readError(response: Response, fallback: string) {
  const errorBody = await response.json().catch(() => null)
  return errorBody?.error?.message || errorBody?.error || fallback
}

export function useAdminInstallmentPlanQuery(offerId: string) {
  return useQuery({
    queryKey: queryKeys.admin.installmentPlan(offerId),
    queryFn: async (): Promise<AdminInstallmentOffer> => {
      const response = await fetch(`/api/admin/installment-plans/${offerId}`)

      if (!response.ok) {
        throw new Error(
          await readError(response, "Failed to fetch installment plan"),
        )
      }

      const body = await response.json()
      return body.data as AdminInstallmentOffer
    },
    enabled: Boolean(offerId),
    staleTime: 60_000,
  })
}
