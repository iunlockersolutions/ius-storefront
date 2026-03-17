"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { invalidateMutationCaches } from "@/lib/utils/query-invalidation-map"

type CategoryPayload = {
  name?: string
  slug?: string
  description?: string
  image?: string | null
  metaTitle?: string
  metaDescription?: string
  parentId?: string | null
  sortOrder?: number
  isActive?: boolean
  showInProductMenu?: boolean
  productMenuPriority?: number
  optionTemplates?: Array<{
    id?: string
    name: string
    sortOrder?: number
  }>
}

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CategoryPayload) => {
      const response = await fetch("/api/admin/categories", {
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
          "Failed to create category"
        throw new Error(message)
      }

      const body = await response.json()
      return body.data as { id: string }
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "category.create")
    },
  })
}

export function useUpdateCategoryMutation(categoryId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CategoryPayload) => {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
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
          "Failed to update category"
        throw new Error(message)
      }

      return response.json()
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "category.update", {
        categoryId,
      })
    },
  })
}

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (categoryId: string) => {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to delete category"
        throw new Error(message)
      }

      return response.json()
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "category.delete")
    },
  })
}
