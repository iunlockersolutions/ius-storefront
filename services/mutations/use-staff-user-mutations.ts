"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { invalidateMutationCaches } from "@/lib/utils/query-invalidation-map"

async function parseApiResponse(response: Response, fallbackMessage: string) {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    const message =
      errorBody?.error?.message || errorBody?.error || fallbackMessage
    throw new Error(message)
  }

  return response.json()
}

export function useBanStaffUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/admin/users/staff/${userId}/ban`, {
        method: "POST",
      })
      return parseApiResponse(response, "Failed to ban user")
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "staff.ban")
    },
  })
}

export function useUnbanStaffUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/admin/users/staff/${userId}/unban`, {
        method: "POST",
      })
      return parseApiResponse(response, "Failed to unban user")
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "staff.unban")
    },
  })
}

export function useResetStaffPasswordMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(
        `/api/admin/users/staff/${userId}/reset-password`,
        {
          method: "POST",
        },
      )
      return parseApiResponse(response, "Failed to reset password")
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "staff.resetPassword")
    },
  })
}

export function useDeleteStaffUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/admin/users/staff/${userId}`, {
        method: "DELETE",
      })
      return parseApiResponse(response, "Failed to delete user")
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "staff.delete")
    },
  })
}
