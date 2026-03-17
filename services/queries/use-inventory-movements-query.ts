"use client"

import { useQuery } from "@tanstack/react-query"

import type { AdminInventoryMovementResponse } from "@/lib/types/admin-inventory"
import { queryKeys } from "@/lib/utils/query-keys"

export function useInventoryMovementsQuery(params: {
  variantId: string
  page: number
  limit?: number
}) {
  return useQuery({
    queryKey: queryKeys.admin.inventoryMovements(params.variantId, {
      page: params.page,
      limit: params.limit ?? 20,
    }),
    queryFn: async (): Promise<AdminInventoryMovementResponse> => {
      const searchParams = new URLSearchParams()
      searchParams.set("page", String(params.page))
      searchParams.set("limit", String(params.limit ?? 20))

      const response = await fetch(
        `/api/admin/inventory/${params.variantId}/movements?${searchParams.toString()}`,
      )

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to fetch movement history"
        throw new Error(message)
      }

      const body = await response.json()
      return body.data as AdminInventoryMovementResponse
    },
    enabled: Boolean(params.variantId),
    staleTime: 60_000,
  })
}
