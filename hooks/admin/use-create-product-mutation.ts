"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { invalidateMutationCaches } from "@/lib/utils/query-invalidation-map"

type CreateProductPayload = {
  name: string
  slug?: string
  description?: string
  shortDescription?: string
  brandId?: string | null
  primaryCategoryId?: string | null
  modelId?: string | null
  categoryIds: string[]
  status?: "draft" | "active" | "archived"
  isFeatured?: boolean
  metaTitle?: string
  metaDescription?: string
  options: Array<{
    name: string
    values: string[]
  }>
  variants: Array<{
    id?: string
    sku?: string
    name?: string
    price: string
    compareAtPrice?: string
    costPrice?: string
    weight?: string
    quantity?: number
    lowStockThreshold?: number
    isDefault?: boolean
    isActive?: boolean
    optionValues: Record<string, string>
  }>
}

type CreateDraftProductPayload = {
  name: string
  slug?: string
  description?: string
  shortDescription?: string
  status?: "draft" | "active" | "archived"
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

export function useCreateDraftProductMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateDraftProductPayload) => {
      const response = await fetch("/api/admin/products/drafts", {
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
          "Failed to create product draft"
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
