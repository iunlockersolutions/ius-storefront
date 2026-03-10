"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/utils/query-keys"

export interface AdminCategory {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  metaTitle: string | null
  metaDescription: string | null
  parentId: string | null
  sortOrder: number
  isActive: boolean
  productCount: number
  level?: number
  path?: string
}

export function useAdminCategoriesQuery() {
  return useQuery({
    queryKey: queryKeys.admin.categories(),
    queryFn: async (): Promise<AdminCategory[]> => {
      const response = await fetch("/api/admin/categories")

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to fetch categories"
        throw new Error(message)
      }

      const body = await response.json()
      return body.data as AdminCategory[]
    },
    staleTime: 60_000,
  })
}
