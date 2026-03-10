"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/utils/query-keys"

type StaffRole = "admin" | "manager" | "support"

interface StaffUser {
  id: string
  name: string | null
  email: string
  image: string | null
  role: string | null
  banned: boolean | null
  banReason: string | null
  createdAt: string | Date
  emailVerified: boolean
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface StaffUsersResponse {
  users: StaffUser[]
  pagination: Pagination
}

interface StaffUsersParams {
  page?: number
  limit?: number
  search?: string
  role?: StaffRole
}

function buildUrl(params?: StaffUsersParams) {
  const searchParams = new URLSearchParams()

  if (params?.page) searchParams.set("page", String(params.page))
  if (params?.limit) searchParams.set("limit", String(params.limit))
  if (params?.search) searchParams.set("search", params.search)
  if (params?.role) searchParams.set("role", params.role)

  const query = searchParams.toString()
  return query ? `/api/admin/users/staff?${query}` : "/api/admin/users/staff"
}

export function useStaffUsersQuery(params?: StaffUsersParams) {
  return useQuery({
    queryKey: queryKeys.admin.staffUsers(params),
    queryFn: async (): Promise<StaffUsersResponse> => {
      const response = await fetch(buildUrl(params))

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to fetch staff users"
        throw new Error(message)
      }

      const body = await response.json()
      return body.data as StaffUsersResponse
    },
    staleTime: 60_000,
  })
}
