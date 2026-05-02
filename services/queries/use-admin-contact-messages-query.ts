"use client"

import { useQuery } from "@tanstack/react-query"

import type { AdminContactMessageListResult } from "@/lib/types/admin-contact-message"
import { queryKeys } from "@/lib/utils/query-keys"

export type ContactMessageStatusFilter =
  | "unread"
  | "open"
  | "replied"
  | "closed"
  | "spam"

export interface AdminContactMessagesParams {
  page?: number
  limit?: number
  search?: string
  status?: ContactMessageStatusFilter
  assigneeId?: string
}

function buildUrl(params?: AdminContactMessagesParams) {
  const searchParams = new URLSearchParams()

  if (params?.page) searchParams.set("page", String(params.page))
  if (params?.limit) searchParams.set("limit", String(params.limit))
  if (params?.search) searchParams.set("search", params.search)
  if (params?.status) searchParams.set("status", params.status)
  if (params?.assigneeId) searchParams.set("assigneeId", params.assigneeId)

  const query = searchParams.toString()
  return query
    ? `/api/admin/contact-messages?${query}`
    : "/api/admin/contact-messages"
}

export function useAdminContactMessagesQuery(
  params?: AdminContactMessagesParams,
) {
  return useQuery({
    queryKey: queryKeys.admin.contactMessages(params),
    queryFn: async (): Promise<AdminContactMessageListResult> => {
      const response = await fetch(buildUrl(params))

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to fetch contact messages"
        throw new Error(message)
      }

      const body = await response.json()
      return body.data as AdminContactMessageListResult
    },
    staleTime: 30_000,
  })
}
