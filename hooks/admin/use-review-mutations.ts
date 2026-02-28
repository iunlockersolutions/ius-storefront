"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { invalidateMutationCaches } from "@/lib/utils/query-invalidation-map"

export function useModerateReviewMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      reviewId: string
      action: "approve" | "reject"
      moderationNotes?: string
    }) => {
      const response = await fetch(
        `/api/admin/reviews/${payload.reviewId}/moderate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: payload.action,
            moderationNotes: payload.moderationNotes,
          }),
        },
      )

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to moderate review"
        throw new Error(message)
      }

      return response.json()
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "review.moderate")
    },
  })
}

export function useBulkModerateReviewsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      reviewIds: string[]
      action: "approve" | "reject"
    }) => {
      const response = await fetch("/api/admin/reviews/bulk-moderate", {
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
          "Failed to moderate reviews"
        throw new Error(message)
      }

      return response.json()
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "review.bulkModerate")
    },
  })
}

export function useDeleteReviewMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (reviewId: string) => {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to delete review"
        throw new Error(message)
      }

      return response.json()
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "review.delete")
    },
  })
}
