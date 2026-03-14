"use client"

import { useQuery } from "@tanstack/react-query"

import type { AdminOrderListItem } from "@/lib/types/admin-order"
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

interface OrdersResponse {
  orders: AdminOrderListItem[]
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
  paymentStatus?:
    | "unpaid"
    | "pending_verification"
    | "authorized"
    | "paid"
    | "failed"
    | "refunded"
    | "cancelled"
  fulfillmentStatus?:
    | "confirmed"
    | "processing"
    | "packing"
    | "shipped"
    | "delivered"
    | "cancelled"
  customerType?: "all" | "guest" | "registered"
  shippingMethod?: string
  view?:
    | "all"
    | "needs_payment_review"
    | "awaiting_processing"
    | "needs_serial_assignment"
    | "ready_to_ship"
    | "delivered"
    | "exceptions"
  sortBy?:
    | "createdAt"
    | "updatedAt"
    | "latestActivityAt"
    | "total"
    | "customer"
    | "paymentStatus"
    | "fulfillmentStatus"
    | "orderNumber"
  sortOrder?: "asc" | "desc"
}

function buildUrl(params?: OrdersParams) {
  const searchParams = new URLSearchParams()

  if (params?.page) searchParams.set("page", String(params.page))
  if (params?.limit) searchParams.set("limit", String(params.limit))
  if (params?.search) searchParams.set("search", params.search)
  if (params?.status) searchParams.set("status", params.status)
  if (params?.paymentStatus) {
    searchParams.set("paymentStatus", params.paymentStatus)
  }
  if (params?.fulfillmentStatus) {
    searchParams.set("fulfillmentStatus", params.fulfillmentStatus)
  }
  if (params?.customerType && params.customerType !== "all") {
    searchParams.set("customerType", params.customerType)
  }
  if (params?.shippingMethod) {
    searchParams.set("shippingMethod", params.shippingMethod)
  }
  if (params?.view && params.view !== "all") {
    searchParams.set("view", params.view)
  }
  if (params?.sortBy && params.sortBy !== "createdAt") {
    searchParams.set("sortBy", params.sortBy)
  }
  if (params?.sortOrder && params.sortOrder !== "desc") {
    searchParams.set("sortOrder", params.sortOrder)
  }

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
