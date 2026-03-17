"use client"

import { useQuery } from "@tanstack/react-query"

import type { AdminOrder } from "@/lib/types/admin-order"
import { queryKeys } from "@/lib/utils/query-keys"

export function useAdminOrderQuery(orderId: string) {
  return useQuery({
    queryKey: queryKeys.admin.order(orderId),
    queryFn: async (): Promise<AdminOrder> => {
      const response = await fetch(`/api/admin/orders/${orderId}`)

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to fetch order"
        throw new Error(message)
      }

      const body = await response.json()
      return body.data as AdminOrder
    },
    enabled: Boolean(orderId),
    staleTime: 60_000,
  })
}
