"use client"

import { ProductEditorForm } from "@/components/admin/products/product-editor-form"
import { useDeleteProductMutation } from "@/hooks/admin/use-delete-product-mutation"
import {
  useUpdateProductImagesMutation,
  useUpdateProductMutation,
} from "@/hooks/admin/use-update-product-mutations"
import type {
  AdminProductDetail,
  AdminProductImage,
} from "@/lib/types/admin-product"

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

const EMPTY_IMAGES: AdminProductImage[] = []

interface EditProductFormProps {
  product: AdminProductDetail
  categories: Category[]
  brands: Brand[]
  models: Model[]
  images?: AdminProductImage[]
}

export function EditProductForm({
  product,
  categories,
  brands,
  models,
  images = EMPTY_IMAGES,
}: EditProductFormProps) {
  const updateProductMutation = useUpdateProductMutation(product.id)
  const updateProductImagesMutation = useUpdateProductImagesMutation(product.id)
  const deleteProductMutation = useDeleteProductMutation()

  return (
    <ProductEditorForm
      categories={categories}
      brands={brands}
      models={models}
      initialData={{
        ...product,
        images,
      }}
      onSave={async (_productId, { images: nextImages, ...payload }) => {
        const updatedProductResponse =
          await updateProductMutation.mutateAsync(payload)
        await updateProductImagesMutation.mutateAsync(nextImages)
        return updatedProductResponse.data
          ? {
              ...updatedProductResponse.data,
              images: nextImages,
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
