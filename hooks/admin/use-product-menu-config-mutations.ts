"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { invalidateMutationCaches } from "@/lib/utils/query-invalidation-map"

type ProductMenuConfigPayload = {
  showInProductMenu: boolean
  menuPriority: number
}

export function useUpdateProductMenuConfigMutation(configId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: ProductMenuConfigPayload) => {
      const response = await fetch(
        `/api/admin/product-menu-configs/${configId}`,
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
            "Failed to update product menu config",
        )
      }

      return response.json()
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "brand.update")
    },
  })
}
