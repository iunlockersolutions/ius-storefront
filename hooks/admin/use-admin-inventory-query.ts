"use client"

import { useQuery } from "@tanstack/react-query"

import type { AdminInventoryListResponse } from "@/lib/types/admin-inventory"
import { queryKeys } from "@/lib/utils/query-keys"

type StockStatus = "all" | "low" | "out" | "normal"

interface InventoryParams {
  page?: number
  limit?: number
  search?: string
  status?: StockStatus
}

function buildUrl(params?: InventoryParams) {
  const searchParams = new URLSearchParams()

  if (params?.page) searchParams.set("page", String(params.page))
  if (params?.limit) searchParams.set("limit", String(params.limit))
  if (params?.search) searchParams.set("search", params.search)
  if (params?.status) searchParams.set("status", params.status)

  const query = searchParams.toString()
  return query ? `/api/admin/inventory?${query}` : "/api/admin/inventory"
}

export function useAdminInventoryQuery(params?: InventoryParams) {
  return useQuery({
    queryKey: queryKeys.admin.inventory(params),
    queryFn: async (): Promise<AdminInventoryListResponse> => {
      const response = await fetch(buildUrl(params))

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to fetch inventory"
        throw new Error(message)
      }

      const body = await response.json()
      return body.data as AdminInventoryListResponse
    },
    staleTime: 60_000,
  })
}
