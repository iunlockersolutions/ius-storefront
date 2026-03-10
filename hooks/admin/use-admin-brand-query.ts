"use client"

import { useQuery } from "@tanstack/react-query"

import type { AdminBrand } from "@/hooks/admin/use-admin-brands-query"
import { queryKeys } from "@/lib/utils/query-keys"

export function useAdminBrandQuery(brandId: string) {
  return useQuery({
    queryKey: queryKeys.admin.brand(brandId),
    queryFn: async (): Promise<AdminBrand> => {
      const response = await fetch(`/api/admin/brands/${brandId}`)

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to fetch brand"
        throw new Error(message)
      }

      const body = await response.json()
      return body.data as AdminBrand
    },
    enabled: Boolean(brandId),
    staleTime: 60_000,
  })
}
