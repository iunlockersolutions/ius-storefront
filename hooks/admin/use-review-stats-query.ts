"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/utils/query-keys"

interface ReviewStats {
  pending: number
  approved: number
  rejected: number
  total: number
  averageRating: number
}

export function useReviewStatsQuery() {
  return useQuery({
    queryKey: queryKeys.admin.reviewStats(),
    queryFn: async (): Promise<ReviewStats> => {
      const response = await fetch("/api/admin/reviews/stats")

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to fetch review stats"
        throw new Error(message)
      }

      const body = await response.json()
      return body.data as ReviewStats
    },
    retry: 2,
    staleTime: 60_000,
  })
}
