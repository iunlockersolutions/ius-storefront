"use client"

import { useQuery } from "@tanstack/react-query"

interface Movement {
  id: string
  type: string
  quantity: number
  previousQuantity: number
  newQuantity: number
  referenceType: string | null
  referenceId: string | null
  notes: string | null
  createdAt: string | Date
  inventoryItemId: string
  variantName: string
  variantSku: string
  productName: string
}

interface MovementsResponse {
  movements: Movement[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function useInventoryMovementsQuery(params: {
  inventoryItemId: string
  page: number
  limit?: number
}) {
  return useQuery({
    queryKey: [
      "admin",
      "inventory",
      "movements",
      params.inventoryItemId,
      params.page,
      params.limit ?? 20,
    ],
    queryFn: async (): Promise<MovementsResponse> => {
      const searchParams = new URLSearchParams()
      searchParams.set("page", String(params.page))
      searchParams.set("limit", String(params.limit ?? 20))

      const response = await fetch(
        `/api/admin/inventory/${params.inventoryItemId}/movements?${searchParams.toString()}`,
      )

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to fetch movement history"
        throw new Error(message)
      }

      const body = await response.json()
      return body.data as MovementsResponse
    },
    enabled: Boolean(params.inventoryItemId),
    retry: 2,
    staleTime: 60_000,
  })
}
