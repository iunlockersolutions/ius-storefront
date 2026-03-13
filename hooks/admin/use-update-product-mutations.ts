"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { AdminProductMutationPayload } from "@/lib/types/admin-product"
import { invalidateMutationCaches } from "@/lib/utils/query-invalidation-map"

type ProductMediaPayload = {
  id?: string
  assetId?: string
  kind: "image" | "video"
  provider?: "vercel_blob" | "external_url"
  access: "public" | "private"
  pathname: string
  url: string
  downloadUrl?: string | null
  mimeType: string
  byteSize: number
  width?: number | null
  height?: number | null
  durationSeconds?: number | null
  etag?: string | null
  originalFilename: string
  placeholderDataUrl?: string | null
  altText?: string | null
  variantId?: string | null
  isPrimaryImage?: boolean
  derivatives?: Array<{
    kind: "blur" | "poster"
    pathname: string
    url: string
    downloadUrl?: string | null
    mimeType: string
    byteSize?: number | null
    width?: number | null
    height?: number | null
  }>
}

async function readApiError(response: Response, fallback: string) {
  const errorBody = await response.json().catch(() => null)
  const detailsErrors = errorBody?.error?.details?.errors

  if (Array.isArray(detailsErrors) && detailsErrors.length > 0) {
    throw new Error(detailsErrors.join("\n"))
  }

  throw new Error(errorBody?.error?.message || errorBody?.error || fallback)
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: AdminProductMutationPayload) => {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        await readApiError(response, "Failed to create product")
      }

      return response.json()
    },
    onSuccess: (result) => {
      invalidateMutationCaches(queryClient, "product.create")

      const productId = result?.data?.id as string | undefined
      if (productId) {
        invalidateMutationCaches(queryClient, "product.update", {
          productId,
        })
      }
    },
  })
}

export function useUpdateProductMutation(productId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: AdminProductMutationPayload) => {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        await readApiError(response, "Failed to update product")
      }

      return response.json()
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "product.update", {
        productId,
      })
    },
  })
}

export function usePublishProductMutation(productId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/products/${productId}/publish`, {
        method: "POST",
      })

      if (!response.ok) {
        await readApiError(response, "Failed to publish product")
      }

      return response.json()
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "product.publish", {
        productId,
      })
    },
  })
}

export function useUpdateProductMediaMutation(productId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (media: ProductMediaPayload[]) => {
      const response = await fetch(`/api/admin/products/${productId}/media`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ media }),
      })

      if (!response.ok) {
        await readApiError(response, "Failed to update product media")
      }

      return response.json()
    },
    onSuccess: () => {
      invalidateMutationCaches(queryClient, "product.updateMedia", {
        productId,
      })
    },
  })
}
