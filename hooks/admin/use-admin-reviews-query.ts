"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/utils/query-keys"

interface Review {
  id: string
  rating: number
  title: string | null
  content: string | null
  status: string
  orderId: string | null
  helpfulCount: number
  createdAt: string | Date
  productId: string
  productName: string
  userId: string | null
  userEmail: string | null
  userName: string | null
}

interface ReviewsResponse {
  reviews: Review[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface ReviewsParams {
  page?: number
  limit?: number
  status?: string
  rating?: number
  search?: string
}

function buildUrl(params?: ReviewsParams) {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set("page", String(params.page))
  if (params?.limit) searchParams.set("limit", String(params.limit))
  if (params?.status) searchParams.set("status", params.status)
  if (params?.rating) searchParams.set("rating", String(params.rating))
  if (params?.search) searchParams.set("search", params.search)

  const query = searchParams.toString()
  return query ? `/api/admin/reviews?${query}` : "/api/admin/reviews"
}

export function useAdminReviewsQuery(params?: ReviewsParams) {
  return useQuery({
    queryKey: queryKeys.admin.reviews(params),
    queryFn: async (): Promise<ReviewsResponse> => {
      const response = await fetch(buildUrl(params))

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to fetch reviews"
        throw new Error(message)
      }

      const body = await response.json()
      return body.data as ReviewsResponse
    },
    staleTime: 60_000,
  })
}
