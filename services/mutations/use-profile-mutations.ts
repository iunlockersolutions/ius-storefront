"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { invalidateMutationCaches } from "@/lib/utils/query-invalidation-map"
import { queryKeys } from "@/lib/utils/query-keys"

export function useUpdateStaffProfileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: { name: string }) => {
      const response = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to update profile"
        throw new Error(message)
      }

      return response.json()
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "profile.update")
    },
  })
}

export function useChangePasswordMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      currentPassword: string
      newPassword: string
    }) => {
      const response = await fetch("/api/admin/profile/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to change password"
        throw new Error(message)
      }

      return response.json()
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "profile.changePassword")
    },
  })
}

export interface UserSession {
  id: string
  token: string
  createdAt: string | Date
  expiresAt: string | Date
  ipAddress: string | null | undefined
  userAgent: string | null | undefined
  isCurrent: boolean
}

export function useUserSessionsQuery() {
  return useQuery({
    queryKey: queryKeys.admin.profileSessions(),
    queryFn: async (): Promise<UserSession[]> => {
      const response = await fetch("/api/admin/profile/sessions")

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to fetch sessions"
        throw new Error(message)
      }

      const body = await response.json()
      return body.data as UserSession[]
    },
    staleTime: 30_000,
  })
}

export function useRevokeSessionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (token: string) => {
      const response = await fetch("/api/admin/profile/sessions/revoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to revoke session"
        throw new Error(message)
      }

      return response.json()
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "profile.revokeSession")
    },
  })
}

export function useRevokeAllOtherSessionsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/profile/sessions/revoke-all", {
        method: "POST",
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to revoke sessions"
        throw new Error(message)
      }

      return response.json()
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "profile.revokeAllOtherSessions")
    },
  })
}
