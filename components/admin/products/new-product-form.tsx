"use client"

import { ProductEditorForm } from "@/components/admin/products/product-editor-form"
import { useCreateDraftProductMutation } from "@/hooks/admin/use-create-product-mutation"

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

interface NewProductFormProps {
  categories: Category[]
  brands: Brand[]
  models: Model[]
}

export function NewProductForm({
  categories,
  brands,
  models,
}: NewProductFormProps) {
  const createDraftProductMutation = useCreateDraftProductMutation()

  return (
    <ProductEditorForm
      mode="create"
      categories={categories}
      brands={brands}
      models={models}
      onCreateDraft={(payload) =>
        createDraftProductMutation.mutateAsync(payload)
      }
      onSave={async (productId, { images, ...payload }) => {
        const productResponse = await fetch(
          `/api/admin/products/${productId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          },
        )

        if (!productResponse.ok) {
          const errorBody = await productResponse.json().catch(() => null)
          throw new Error(
            errorBody?.error?.message ||
              errorBody?.error ||
              "Failed to save product",
          )
        }

        const productBody = await productResponse.json()

        const imageResponse = await fetch(
          `/api/admin/products/${productId}/images`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ images }),
          },
        )

        if (!imageResponse.ok) {
          const errorBody = await imageResponse.json().catch(() => null)
          throw new Error(
            errorBody?.error?.message ||
              errorBody?.error ||
              "Failed to save product images",
          )
        }

        return {
          ...productBody.data,
          images,
        }
      }}
    />
  )
}
