"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/utils/query-keys"

export interface AdminCustomerDetail {
  user: {
    id: string
    name: string | null
    email: string
    emailVerified: boolean
    image: string | null
    createdAt: string | Date
  }
  profile: {
    id: string
    phone: string | null
    dateOfBirth: string | Date | null
    marketingOptIn: boolean
  } | null
  addresses: Array<{
    id: string
    type: string
    isDefault: boolean
    label: string | null
    recipientName: string
    phone: string
    addressLine1: string
    addressLine2: string | null
    city: string
    state: string | null
    postalCode: string
    country: string
  }>
  roles: Array<{ roleId: string; roleName: string }>
  stats: {
    totalOrders: number
    totalSpent: number
  }
}

export function useAdminCustomerQuery(customerId: string) {
  return useQuery({
    queryKey: queryKeys.admin.customer(customerId),
    queryFn: async (): Promise<AdminCustomerDetail> => {
      const response = await fetch(`/api/admin/customers/${customerId}`)

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to fetch customer"
        throw new Error(message)
      }

      const body = await response.json()
      return body.data as AdminCustomerDetail
    },
    enabled: Boolean(customerId),
    retry: 2,
    staleTime: 60_000,
  })
}
