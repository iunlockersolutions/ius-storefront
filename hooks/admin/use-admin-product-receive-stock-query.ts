"use client"

import { useQuery } from "@tanstack/react-query"

import type { AdminProductReceiveStockContext } from "@/lib/types/admin-inventory"
import { queryKeys } from "@/lib/utils/query-keys"

export function useAdminProductReceiveStockQuery(productId: string) {
  return useQuery({
    queryKey: queryKeys.admin.productReceiveStock(productId),
    queryFn: async (): Promise<AdminProductReceiveStockContext> => {
      const response = await fetch(
        `/api/admin/products/${productId}/receive-stock`,
      )

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to fetch stock intake context"
        throw new Error(message)
      }

      const body = await response.json()
      return body.data as AdminProductReceiveStockContext
    },
    enabled: Boolean(productId),
    staleTime: 30_000,
  })
}
