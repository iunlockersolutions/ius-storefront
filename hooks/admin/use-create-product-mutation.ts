"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { invalidateMutationCaches } from "@/lib/utils/query-invalidation-map"

type CreateProductPayload = {
  name: string
  slug?: string
  description?: string
  shortDescription?: string
  brandId: string
  primaryCategoryId: string
  productModelGroupId: string
  categoryIds: string[]
  basePrice: string
  compareAtPrice?: string
  costPrice?: string
  status?: "draft" | "active" | "archived"
  isFeatured?: boolean
  metaTitle?: string
  metaDescription?: string
  variants: Array<{
    id?: string
    sku?: string
    name: string
    price: string
    compareAtPrice?: string
    costPrice?: string
    weight?: string
    isDefault?: boolean
    isActive?: boolean
  }>
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateProductPayload) => {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to create product"
        throw new Error(message)
      }

      const body = await response.json()
      return body.data as { id: string }
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "product.create")
    },
  })
}
