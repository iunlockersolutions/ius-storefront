"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/utils/query-keys"

export interface CustomerRole {
  id: string
  name: string
}

export function useCustomerRolesQuery() {
  return useQuery({
    queryKey: queryKeys.admin.customerRoles(),
    queryFn: async (): Promise<CustomerRole[]> => {
      const response = await fetch("/api/admin/customers/roles")

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to fetch roles"
        throw new Error(message)
      }

      const body = await response.json()
      return body.data as CustomerRole[]
    },
    retry: 2,
    staleTime: 300_000,
  })
}
