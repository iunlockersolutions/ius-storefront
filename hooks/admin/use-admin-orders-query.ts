"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/utils/query-keys"

type OrderStatus =
  | "draft"
  | "pending_payment"
  | "paid"
  | "processing"
  | "packing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"

interface Order {
  id: string
  orderNumber: string
  status: OrderStatus
  subtotal: string
  tax: string
  shippingCost: string
  discount: string
  total: string
  createdAt: string | Date
  customer: {
    id: string | null
    name: string | null
    email: string | null
  } | null
}

interface OrdersResponse {
  orders: Order[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface OrdersParams {
  page?: number
  limit?: number
  search?: string
  status?: OrderStatus
}

function buildUrl(params?: OrdersParams) {
  const searchParams = new URLSearchParams()

  if (params?.page) searchParams.set("page", String(params.page))
  if (params?.limit) searchParams.set("limit", String(params.limit))
  if (params?.search) searchParams.set("search", params.search)
  if (params?.status) searchParams.set("status", params.status)

  const query = searchParams.toString()
  return query ? `/api/admin/orders?${query}` : "/api/admin/orders"
}

export function useAdminOrdersQuery(params?: OrdersParams) {
  return useQuery({
    queryKey: queryKeys.admin.orders(params),
    queryFn: async (): Promise<OrdersResponse> => {
      const response = await fetch(buildUrl(params))

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to fetch orders"
        throw new Error(message)
      }

      const body = await response.json()
      return body.data as OrdersResponse
    },
    staleTime: 60_000,
  })
}
