"use client"

import { useQuery } from "@tanstack/react-query"

import type { AdminNotificationFeed } from "@/lib/types/admin-contact-message"
import { queryKeys } from "@/lib/utils/query-keys"

export function useAdminNotificationsQuery() {
  return useQuery({
    queryKey: queryKeys.admin.notifications(),
    queryFn: async (): Promise<AdminNotificationFeed> => {
      const response = await fetch("/api/admin/notifications")
      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to load notifications"
        throw new Error(message)
      }
      const body = await response.json()
      return body.data as AdminNotificationFeed
    },
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  })
}
