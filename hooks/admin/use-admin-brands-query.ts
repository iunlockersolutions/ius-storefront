"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/utils/query-keys"

export interface AdminBrand {
  id: string
  name: string
  slug: string
  description: string | null
  logo: string | null
  websiteUrl: string | null
  isActive: boolean
  sortOrder: number
  metaTitle: string | null
  metaDescription: string | null
  productCount: number
  modelCount?: number
  categoryAssignments: Array<{
    categoryId: string
    categoryName: string
    categorySlug: string
    navPriority: number
    showInProductMenu: boolean
  }>
}

export function useAdminBrandsQuery() {
  return useQuery({
    queryKey: queryKeys.admin.brands(),
    queryFn: async (): Promise<AdminBrand[]> => {
      const response = await fetch("/api/admin/brands")

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to fetch brands"
        throw new Error(message)
      }

      const body = await response.json()
      return body.data as AdminBrand[]
    },
    staleTime: 60_000,
  })
}
