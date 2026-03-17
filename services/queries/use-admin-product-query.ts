"use client"

import { useQuery } from "@tanstack/react-query"

import type { AdminProductDetail } from "@/lib/types/admin-product"
import { queryKeys } from "@/lib/utils/query-keys"

export function useAdminProductQuery(productId: string) {
  return useQuery({
    queryKey: queryKeys.admin.product(productId),
    queryFn: async (): Promise<AdminProductDetail> => {
      const response = await fetch(`/api/admin/products/${productId}`)

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to fetch product"
        throw new Error(message)
      }

      const body = await response.json()
      return body.data as AdminProductDetail
    },
    enabled: Boolean(productId),
    staleTime: 60_000,
  })
}
