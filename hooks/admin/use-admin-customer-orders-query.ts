"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/utils/query-keys"

interface CustomerOrder {
  id: string
  orderNumber: string
  status: string
  total: string
  createdAt: string | Date
}

interface CustomerOrdersResponse {
  orders: CustomerOrder[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface CustomerOrdersParams {
  customerId: string
  page?: number
  limit?: number
}

function buildUrl(params: CustomerOrdersParams) {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set("page", String(params.page))
  if (params.limit) searchParams.set("limit", String(params.limit))

  const query = searchParams.toString()
  return query
    ? `/api/admin/customers/${params.customerId}/orders?${query}`
    : `/api/admin/customers/${params.customerId}/orders`
}

export function useAdminCustomerOrdersQuery(params: CustomerOrdersParams) {
  return useQuery({
    queryKey: queryKeys.admin.customerOrders(params.customerId, {
      page: params.page,
      limit: params.limit,
    }),
    queryFn: async (): Promise<CustomerOrdersResponse> => {
      const response = await fetch(buildUrl(params))

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to fetch customer orders"
        throw new Error(message)
      }

      const body = await response.json()
      return body.data as CustomerOrdersResponse
    },
    enabled: Boolean(params.customerId),
    staleTime: 60_000,
  })
}
