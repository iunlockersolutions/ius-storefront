"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { invalidateMutationCaches } from "@/lib/utils/query-invalidation-map"

type ProductModelGroupPayload = {
  name?: string
  slug?: string
  description?: string | null
  primaryCategoryId?: string
  brandId?: string
  showInProductMenu?: boolean
  navPriority?: number
  isActive?: boolean
}

export function useCreateProductModelGroupMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: ProductModelGroupPayload) => {
      const response = await fetch("/api/admin/product-model-groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        throw new Error(
          errorBody?.error?.message ||
            errorBody?.error ||
            "Failed to create model",
        )
      }

      const body = await response.json()
      return body.data as { id: string }
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "model.create")
    },
  })
}

export function useUpdateProductModelGroupMutation(groupId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: ProductModelGroupPayload) => {
      const response = await fetch(
        `/api/admin/product-model-groups/${groupId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      )

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        throw new Error(
          errorBody?.error?.message ||
            errorBody?.error ||
            "Failed to update model",
        )
      }

      return response.json()
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "model.update")
    },
  })
}

export function useDeleteProductModelGroupMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (groupId: string) => {
      const response = await fetch(
        `/api/admin/product-model-groups/${groupId}`,
        {
          method: "DELETE",
        },
      )

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        throw new Error(
          errorBody?.error?.message ||
            errorBody?.error ||
            "Failed to delete model",
        )
      }

      return response.json()
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "model.delete")
    },
  })
}
