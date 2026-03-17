"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/utils/query-keys"

interface Payment {
  id: string
  orderId: string
  method: string
  status: string
  amount: string
  currency: string
  externalId: string | null
  processedAt: string | Date | null
  createdAt: string | Date
  orderNumber: string
  customerEmail: string
  customerName: string | null
}

interface PaymentsResponse {
  payments: Payment[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface PaymentsParams {
  page?: number
  limit?: number
  status?: string
  method?: string
  search?: string
}

function buildUrl(params?: PaymentsParams) {
  const searchParams = new URLSearchParams()

  if (params?.page) searchParams.set("page", String(params.page))
  if (params?.limit) searchParams.set("limit", String(params.limit))
  if (params?.status) searchParams.set("status", params.status)
  if (params?.method) searchParams.set("method", params.method)
  if (params?.search) searchParams.set("search", params.search)

  const query = searchParams.toString()
  return query ? `/api/admin/payments?${query}` : "/api/admin/payments"
}

export function useAdminPaymentsQuery(params?: PaymentsParams) {
  return useQuery({
    queryKey: queryKeys.admin.payments(params),
    queryFn: async (): Promise<PaymentsResponse> => {
      const response = await fetch(buildUrl(params))

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to fetch payments"
        throw new Error(message)
      }

      const body = await response.json()
      return body.data as PaymentsResponse
    },
    staleTime: 60_000,
  })
}
