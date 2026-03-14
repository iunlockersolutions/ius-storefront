"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"

import type {
  AdminInventorySortOrder,
  AdminInventoryUnitIdentifierFilter,
  AdminInventoryUnitSortField,
  AdminInventoryUnitsResponse,
  AdminInventoryUnitStatus,
} from "@/lib/types/admin-inventory"
import { queryKeys } from "@/lib/utils/query-keys"

interface UseAdminInventoryUnitsQueryParams {
  variantId: string
  page: number
  limit: number
  search: string
  status: AdminInventoryUnitStatus | "all"
  identifierType: AdminInventoryUnitIdentifierFilter
  sortBy: AdminInventoryUnitSortField
  sortOrder: AdminInventorySortOrder
  enabled?: boolean
}

export function useAdminInventoryUnitsQuery(
  params: UseAdminInventoryUnitsQueryParams,
) {
  return useQuery({
    queryKey: queryKeys.admin.inventoryUnits(params.variantId, {
      page: params.page,
      limit: params.limit,
      search: params.search,
      status: params.status,
      identifierType: params.identifierType,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    }),
    queryFn: async (): Promise<AdminInventoryUnitsResponse> => {
      const searchParams = new URLSearchParams()
      searchParams.set("page", String(params.page))
      searchParams.set("limit", String(params.limit))

      if (params.search.trim()) {
        searchParams.set("search", params.search.trim())
      }

      if (params.status !== "all") {
        searchParams.set("status", params.status)
      }

      if (params.identifierType !== "all") {
        searchParams.set("identifierType", params.identifierType)
      }

      if (params.sortBy !== "updated") {
        searchParams.set("sortBy", params.sortBy)
      }

      if (!(params.sortBy === "updated" && params.sortOrder === "desc")) {
        searchParams.set("sortOrder", params.sortOrder)
      }

      const response = await fetch(
        `/api/admin/inventory/${params.variantId}/units?${searchParams.toString()}`,
      )

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to fetch serialized units"
        throw new Error(message)
      }

      const body = await response.json()
      return body.data as AdminInventoryUnitsResponse
    },
    enabled: Boolean(params.variantId) && (params.enabled ?? true),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  })
}
