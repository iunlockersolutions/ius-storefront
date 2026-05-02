"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { invalidateMutationCaches } from "@/lib/utils/query-invalidation-map"
import type { AdminInstallmentTerm } from "@/services/queries/use-admin-installment-plans-query"

export type InstallmentPlanPayload = {
  title?: string
  slug?: string | null
  providerName?: string
  logoUrl?: string | null
  bannerImageUrl?: string | null
  summary?: string
  description?: string | null
  readMoreLabel?: string
  terms?: AdminInstallmentTerm[]
  termsAndConditions?: string[]
  isPublished?: boolean
  sortOrder?: number
}

async function readError(response: Response, fallback: string) {
  const errorBody = await response.json().catch(() => null)
  return errorBody?.error?.message || errorBody?.error || fallback
}

export function useCreateInstallmentPlanMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: InstallmentPlanPayload) => {
      const response = await fetch("/api/admin/installment-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(
          await readError(response, "Failed to create installment plan"),
        )
      }

      const body = await response.json()
      return body.data as { id: string }
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "installmentPlan.create")
    },
  })
}

export function useUpdateInstallmentPlanMutation(offerId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: InstallmentPlanPayload) => {
      const response = await fetch(`/api/admin/installment-plans/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(
          await readError(response, "Failed to update installment plan"),
        )
      }

      const body = await response.json()
      return body.data
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "installmentPlan.update", {
        installmentPlanId: offerId,
      })
    },
  })
}

export function useSetInstallmentPlanPublishedMutation(offerId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (isPublished: boolean) => {
      const response = await fetch(`/api/admin/installment-plans/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished }),
      })

      if (!response.ok) {
        throw new Error(
          await readError(
            response,
            isPublished
              ? "Failed to publish installment plan"
              : "Failed to unpublish installment plan",
          ),
        )
      }

      const body = await response.json()
      return body.data
    },
    onSuccess: (_data, isPublished) => {
      invalidateMutationCaches(
        queryClient,
        isPublished ? "installmentPlan.publish" : "installmentPlan.unpublish",
        { installmentPlanId: offerId },
      )
    },
  })
}

export function useDeleteInstallmentPlanMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (offerId: string) => {
      const response = await fetch(`/api/admin/installment-plans/${offerId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(
          await readError(response, "Failed to delete installment plan"),
        )
      }

      return response.json()
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "installmentPlan.delete")
    },
  })
}
