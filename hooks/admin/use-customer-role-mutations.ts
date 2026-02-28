"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { invalidateMutationCaches } from "@/lib/utils/query-invalidation-map"

export function useAssignCustomerRoleMutation(customerId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (roleId: string) => {
      const response = await fetch(`/api/admin/customers/${customerId}/roles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roleId }),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to assign role"
        throw new Error(message)
      }

      return response.json()
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "customerRole.assign", {
        customerId,
      })
    },
  })
}

export function useRemoveCustomerRoleMutation(customerId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (roleId: string) => {
      const response = await fetch(
        `/api/admin/customers/${customerId}/roles/${roleId}`,
        {
          method: "DELETE",
        },
      )

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to remove role"
        throw new Error(message)
      }

      return response.json()
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "customerRole.remove", {
        customerId,
      })
    },
  })
}
