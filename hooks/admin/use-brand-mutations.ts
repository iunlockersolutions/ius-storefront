"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { invalidateMutationCaches } from "@/lib/utils/query-invalidation-map"

type BrandPayload = {
  name?: string
  slug?: string
  description?: string
  logo?: string | null
  websiteUrl?: string | null
  isActive?: boolean
  sortOrder?: number
  metaTitle?: string
  metaDescription?: string
}

export function useCreateBrandMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: BrandPayload) => {
      const response = await fetch("/api/admin/brands", {
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
          "Failed to create brand"
        throw new Error(message)
      }

      const body = await response.json()
      return body.data as { id: string }
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "brand.create")
    },
  })
}

export function useUpdateBrandMutation(brandId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: BrandPayload) => {
      const response = await fetch(`/api/admin/brands/${brandId}`, {
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
          "Failed to update brand"
        throw new Error(message)
      }

      return response.json()
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "brand.update", {
        brandId,
      })
    },
  })
}

export function useDeleteBrandMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (brandId: string) => {
      const response = await fetch(`/api/admin/brands/${brandId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to delete brand"
        throw new Error(message)
      }

      return response.json()
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "brand.delete")
    },
  })
}
