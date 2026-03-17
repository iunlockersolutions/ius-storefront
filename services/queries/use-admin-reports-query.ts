"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/utils/query-keys"

interface AdminReportsParams {
  days?: number
  topProductsLimit?: number
}

interface AdminReportsResponse {
  salesOverview: {
    totalOrders: number
    totalRevenue: number
    avgOrderValue: number
    pendingOrders: number
    pendingRevenue: number
    todayOrders: number
    todayRevenue: number
  }
  salesByDay: Array<{
    date: string
    orders: number
    revenue: number
  }>
  topProducts: Array<{
    productId: string
    productName: string
    totalQuantity: number
    totalRevenue: number
    orderCount: number
  }>
  paymentMethodStats: Array<{
    method: string
    count: number
    total: number
  }>
  customerStats: {
    totalCustomers: number
    newCustomersThisMonth: number
    customersWithOrders: number
    topCustomers: Array<{
      userId: string | null
      email: string
      name: string | null
      orderCount: number
      totalSpent: number
    }>
  }
  orderStatusDistribution: Array<{
    status: string
    count: number
  }>
}

function buildUrl(params?: AdminReportsParams) {
  const searchParams = new URLSearchParams()

  if (params?.days) searchParams.set("days", String(params.days))
  if (params?.topProductsLimit) {
    searchParams.set("topProductsLimit", String(params.topProductsLimit))
  }

  const query = searchParams.toString()
  return query ? `/api/admin/reports?${query}` : "/api/admin/reports"
}

export function useAdminReportsQuery(params?: AdminReportsParams) {
  return useQuery({
    queryKey: queryKeys.admin.reports(params),
    queryFn: async (): Promise<AdminReportsResponse> => {
      const response = await fetch(buildUrl(params))

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to fetch reports"
        throw new Error(message)
      }

      const body = await response.json()
      return body.data as AdminReportsResponse
    },
    staleTime: 60_000,
  })
}
