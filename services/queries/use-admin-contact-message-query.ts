"use client"

import { useQuery } from "@tanstack/react-query"

import type { AdminContactMessageDetail } from "@/lib/types/admin-contact-message"
import { queryKeys } from "@/lib/utils/query-keys"

export function useAdminContactMessageQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.admin.contactMessage(id),
    queryFn: async (): Promise<AdminContactMessageDetail> => {
      const response = await fetch(`/api/admin/contact-messages/${id}`)

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to fetch contact message"
        throw new Error(message)
      }

      const body = await response.json()
      return body.data as AdminContactMessageDetail
    },
    enabled: Boolean(id),
    staleTime: 30_000,
  })
}
