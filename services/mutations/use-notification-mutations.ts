"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { invalidateMutationCaches } from "@/lib/utils/query-invalidation-map"

export function useMarkNotificationsReadMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (ids?: string[]) => {
      const response = await fetch("/api/admin/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ids && ids.length > 0 ? { ids } : {}),
      })
      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to mark notifications read"
        throw new Error(message)
      }
      return response.json()
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "notification.markRead", {})
    },
  })
}
