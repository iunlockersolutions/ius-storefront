"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/utils/query-keys"

export type AdminInstallmentTerm = {
  months: number
  label: string
  minimumAmount?: string | null
  notes?: string | null
}

export type AdminInstallmentOffer = {
  id: string
  title: string
  slug: string
  providerName: string
  logoUrl: string | null
  bannerImageUrl: string | null
  summary: string
  description: string | null
  readMoreLabel: string
  terms: AdminInstallmentTerm[]
  termsAndConditions: string[]
  isPublished: boolean
  publishedAt: string | Date | null
  sortOrder: number
  createdAt: string | Date
  updatedAt: string | Date
}

interface InstallmentPlansParams {
  page?: number
  limit?: number
  search?: string
  status?: string
}

interface InstallmentPlansResponse {
  offers: AdminInstallmentOffer[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

function buildUrl(params?: InstallmentPlansParams) {
  const searchParams = new URLSearchParams()

  if (params?.page) searchParams.set("page", String(params.page))
  if (params?.limit) searchParams.set("limit", String(params.limit))
  if (params?.search) searchParams.set("search", params.search)
  if (params?.status && params.status !== "all") {
    searchParams.set("status", params.status)
  }

  const query = searchParams.toString()
  return query
    ? `/api/admin/installment-plans?${query}`
    : "/api/admin/installment-plans"
}

async function readError(response: Response, fallback: string) {
  const errorBody = await response.json().catch(() => null)
  return errorBody?.error?.message || errorBody?.error || fallback
}

export function useAdminInstallmentPlansQuery(params?: InstallmentPlansParams) {
  return useQuery({
    queryKey: queryKeys.admin.installmentPlans(params),
    queryFn: async (): Promise<InstallmentPlansResponse> => {
      const response = await fetch(buildUrl(params))

      if (!response.ok) {
        throw new Error(
          await readError(response, "Failed to fetch installment plans"),
        )
      }

      const body = await response.json()
      return body.data as InstallmentPlansResponse
    },
    staleTime: 60_000,
  })
}
