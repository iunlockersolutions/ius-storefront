"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/utils/query-keys"

export interface AdminProfile {
  id: string
  name: string | null
  email: string
  image: string | null
  emailVerified: boolean
  createdAt: string | Date
  updatedAt: string | Date
  role: "admin" | "manager" | "support"
  lastPasswordChange: string | Date | null
  roles: Array<{
    name: string
    description: string | null
    assignedAt: string | Date
  }>
}

export function useAdminProfileQuery() {
  return useQuery({
    queryKey: queryKeys.admin.profile(),
    queryFn: async (): Promise<AdminProfile> => {
      const response = await fetch("/api/admin/profile")

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to fetch profile"
        throw new Error(message)
      }

      const body = await response.json()
      return body.data as AdminProfile
    },
    retry: 2,
    staleTime: 60_000,
  })
}
