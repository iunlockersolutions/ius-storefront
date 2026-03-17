"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/utils/query-keys"

interface Customer {
  id: string
  name: string | null
  email: string
  emailVerified: boolean
  image: string | null
  createdAt: string | Date
  orderCount: number
  totalSpent: number
}

interface CustomersResponse {
  customers: Customer[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface CustomersParams {
  page?: number
  limit?: number
  search?: string
}

function buildUrl(params?: CustomersParams) {
  const searchParams = new URLSearchParams()

  if (params?.page) searchParams.set("page", String(params.page))
  if (params?.limit) searchParams.set("limit", String(params.limit))
  if (params?.search) searchParams.set("search", params.search)

  const query = searchParams.toString()
  return query ? `/api/admin/customers?${query}` : "/api/admin/customers"
}

export function useAdminCustomersQuery(params?: CustomersParams) {
  return useQuery({
    queryKey: queryKeys.admin.customers(params),
    queryFn: async (): Promise<CustomersResponse> => {
      const response = await fetch(buildUrl(params))

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to fetch customers"
        throw new Error(message)
      }

      const body = await response.json()
      return body.data as CustomersResponse
    },
    staleTime: 60_000,
  })
}
