"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/utils/query-keys"

interface PendingReview {
  id: string
  rating: number
  title: string | null
  content: string | null
  status: string
  orderId: string | null
  createdAt: string | Date
  productId: string
  productName: string
  userId: string | null
  userEmail: string | null
  userName: string | null
}

export function usePendingReviewsQuery() {
  return useQuery({
    queryKey: queryKeys.admin.pendingReviews(),
    queryFn: async (): Promise<PendingReview[]> => {
      const response = await fetch("/api/admin/reviews/pending")

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to fetch pending reviews"
        throw new Error(message)
      }

      const body = await response.json()
      return body.data as PendingReview[]
    },
    retry: 2,
    staleTime: 60_000,
  })
}
