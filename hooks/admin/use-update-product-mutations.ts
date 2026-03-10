"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { invalidateMutationCaches } from "@/lib/utils/query-invalidation-map"

type UpdateProductPayload = {
  name: string
  slug?: string
  description?: string
  shortDescription?: string
  brandId: string
  primaryCategoryId: string
  categoryIds: string[]
  basePrice: string
  compareAtPrice?: string
  costPrice?: string
  status: "draft" | "active" | "archived"
  isFeatured: boolean
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

type ProductImagePayload = {
  id?: string
  url: string
  altText?: string
  isPrimary?: boolean
}

export function useUpdateProductMutation(productId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: UpdateProductPayload) => {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
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
          "Failed to update product"
        throw new Error(message)
      }

      return response.json()
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "product.update")
    },
  })
}

export function useUpdateProductImagesMutation(productId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (images: ProductImagePayload[]) => {
      const response = await fetch(`/api/admin/products/${productId}/images`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ images }),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to update product images"
        throw new Error(message)
      }

      return response.json()
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "product.updateImages")
    },
  })
}
