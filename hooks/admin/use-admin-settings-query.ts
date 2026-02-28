"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/utils/query-keys"

export function useAdminSettingsQuery() {
  return useQuery({
    queryKey: queryKeys.admin.settings(),
    queryFn: async (): Promise<Record<string, string>> => {
      const response = await fetch("/api/admin/settings")

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to fetch settings"
        throw new Error(message)
      }

      const body = await response.json()
      return body.data as Record<string, string>
    },
    retry: 2,
    staleTime: 60_000,
  })
}
