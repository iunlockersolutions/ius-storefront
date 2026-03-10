"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/utils/query-keys"

interface Product {
  id: string
  name: string
  slug: string
  status: "draft" | "active" | "archived"
  basePrice: string
  isFeatured: boolean
  brandId: string | null
  brandName: string | null
  primaryCategoryId: string | null
  primaryCategoryName: string | null
  createdAt: string | Date
}

interface ProductsResponse {
  products: Product[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface AdminProductsParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  categoryId?: string
  brandId?: string
}

function buildUrl(params?: AdminProductsParams) {
  const searchParams = new URLSearchParams()

  if (params?.page) searchParams.set("page", String(params.page))
  if (params?.limit) searchParams.set("limit", String(params.limit))
  if (params?.search) searchParams.set("search", params.search)
  if (params?.status) searchParams.set("status", params.status)
  if (params?.categoryId) searchParams.set("categoryId", params.categoryId)
  if (params?.brandId) searchParams.set("brandId", params.brandId)

  const query = searchParams.toString()
  return query ? `/api/admin/products?${query}` : "/api/admin/products"
}

export function useAdminProductsQuery(params?: AdminProductsParams) {
  return useQuery({
    queryKey: queryKeys.admin.products(params),
    queryFn: async (): Promise<ProductsResponse> => {
      const response = await fetch(buildUrl(params))

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        const message =
          errorBody?.error?.message ||
          errorBody?.error ||
          "Failed to fetch admin products"
        throw new Error(message)
      }

      const body = await response.json()
      return body.data as ProductsResponse
    },
    staleTime: 60_000,
  })
}
