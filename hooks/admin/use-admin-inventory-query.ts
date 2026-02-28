"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/utils/query-keys"

type StockStatus = "all" | "low" | "out" | "normal"

interface InventoryItem {
  id: string
  variantId: string
  quantity: number
  reservedQuantity: number
  lowStockThreshold: number | null
  availableQuantity: number
  isLowStock: boolean
  isOutOfStock: boolean
  variantName: string
  variantSku: string
  variantPrice: string
  productId: string
  productName: string
  productSlug: string
}

interface InventoryStats {
  totalItems: number
  lowStockItems: number
  outOfStockItems: number
  totalReserved: number
}

interface LowStockAlert {
  id: string
  variantId: string
  quantity: number
  reservedQuantity: number
  lowStockThreshold: number | null
  availableQuantity: number
  isOutOfStock: boolean
  variantName: string
  variantSku: string
  productName: string
  productSlug: string
}

interface InventoryResponse {
  stats: InventoryStats
  inventory: {
    items: InventoryItem[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
  lowStockAlerts: LowStockAlert[]
}

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
    queryFn: async (): Promise<InventoryResponse> => {
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
      return body.data as InventoryResponse
    },
    retry: 2,
    staleTime: 60_000,
  })
}
