"use client"

import { useQuery } from "@tanstack/react-query"

import type { AdminCategory } from "@/services/queries/use-admin-categories-query"
import { queryKeys } from "@/lib/utils/query-keys"

export function useAdminCategoryQuery(categoryId: string) {
  return useQuery({
    queryKey: queryKeys.admin.category(categoryId),
    queryFn: async (): Promise<AdminCategory> => {
      const response = await fetch(`/api/admin/categories/${categoryId}`)

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to fetch category"
        throw new Error(message)
      }

      const body = await response.json()
      return body.data as AdminCategory
    },
    enabled: Boolean(categoryId),
    staleTime: 60_000,
  })
}
