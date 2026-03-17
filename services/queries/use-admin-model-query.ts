"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/utils/query-keys"

export interface AdminModel {
  id: string
  name: string
  slug: string
  description: string | null
  metaTitle: string | null
  metaDescription: string | null
  brandId: string
  brandName: string
  primaryCategoryId: string
  primaryCategoryName: string
  showInProductMenu: boolean
  navPriority: number
  isActive: boolean
  productCount: number
  createdAt?: string | Date
  updatedAt?: string | Date
}

export function useAdminModelQuery(modelId: string) {
  return useQuery({
    queryKey: queryKeys.admin.model(modelId),
    queryFn: async (): Promise<AdminModel> => {
      const response = await fetch(`/api/admin/product-model-groups/${modelId}`)

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        throw new Error(
          errorBody?.error?.message ||
            errorBody?.error ||
            "Failed to fetch model",
        )
      }

      const body = await response.json()
      return body.data as AdminModel
    },
    enabled: Boolean(modelId),
    staleTime: 60_000,
  })
}
