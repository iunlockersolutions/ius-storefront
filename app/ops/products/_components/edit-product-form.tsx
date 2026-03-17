"use client"

import type {
  AdminProductDetail,
  AdminProductMedia,
} from "@/lib/types/admin-product"
import { useDeleteProductMutation } from "@/services/mutations/use-delete-product-mutation"
import {
  useUpdateProductMediaMutation,
  useUpdateProductMutation,
} from "@/services/mutations/use-update-product-mutations"

import { ProductEditorForm } from "./product-editor-form"

interface Category {
  id: string
  name: string
  slug: string
  parentId: string | null
  level: number
  path: string
  optionTemplates: Array<{
    id: string
    name: string
    sortOrder: number
  }>
}

interface Brand {
  id: string
  name: string
  slug: string
}

interface Model {
  id: string
  name: string
  slug: string
  primaryCategoryId: string
  brandId: string
  isActive: boolean
}

const EMPTY_MEDIA: AdminProductMedia[] = []

interface EditProductFormProps {
  product: AdminProductDetail
  categories: Category[]
  brands: Brand[]
  models: Model[]
  media?: AdminProductMedia[]
}

export function EditProductForm({
  product,
  categories,
  brands,
  models,
  media = EMPTY_MEDIA,
}: EditProductFormProps) {
  const updateProductMutation = useUpdateProductMutation(product.id)
  const updateProductMediaMutation = useUpdateProductMediaMutation(product.id)
  const deleteProductMutation = useDeleteProductMutation()

  return (
    <ProductEditorForm
      categories={categories}
      brands={brands}
      models={models}
      initialData={{
        ...product,
        media,
      }}
      onSave={async (_productId, { media: nextMedia, ...payload }) => {
        const updatedProductResponse =
          await updateProductMutation.mutateAsync(payload)
        const updatedMediaResponse =
          await updateProductMediaMutation.mutateAsync(nextMedia)
        return updatedProductResponse.data
          ? {
              ...updatedProductResponse.data,
              media: updatedMediaResponse.data ?? [],
            }
          : null
      }}
      onDelete={async () => {
        await deleteProductMutation.mutateAsync(product.id)
      }}
      onPublish={async (productId) => {
        const response = await fetch(
          `/api/admin/products/${productId}/publish`,
          {
            method: "POST",
          },
        )

        if (!response.ok) {
          const errorBody = await response.json().catch(() => null)
          const errors = errorBody?.error?.details?.errors
          throw new Error(
            Array.isArray(errors) && errors.length > 0
              ? errors.join("\n")
              : errorBody?.error?.message ||
                  errorBody?.error ||
                  "Failed to publish product",
          )
        }

        const body = await response.json()
        return body.data ?? null
      }}
    />
  )
}
