"use client"

import { useQuery } from "@tanstack/react-query"

import type { AdminInventoryDetail } from "@/lib/types/admin-inventory"
import { queryKeys } from "@/lib/utils/query-keys"

export function useAdminInventoryDetailQuery(variantId: string) {
  return useQuery({
    queryKey: queryKeys.admin.inventoryDetail(variantId),
    queryFn: async (): Promise<AdminInventoryDetail> => {
      const response = await fetch(`/api/admin/inventory/${variantId}`)

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to fetch inventory detail"
        throw new Error(message)
      }

      const body = await response.json()
      return body.data as AdminInventoryDetail
    },
    enabled: Boolean(variantId),
    staleTime: 30_000,
  })
}
