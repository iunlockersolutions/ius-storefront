"use client"

import { ProductEditorForm } from "@/components/admin/products/product-editor-form"
import { useCreateProductMutation } from "@/hooks/admin/use-create-product-mutation"

interface Category {
  id: string
  name: string
  slug: string
  level: number
  path: string
}

interface Brand {
  id: string
  name: string
  slug: string
}

interface NewProductFormProps {
  categories: Category[]
  brands: Brand[]
}

export function NewProductForm({ categories, brands }: NewProductFormProps) {
  const createProductMutation = useCreateProductMutation()

  return (
    <ProductEditorForm
      mode="create"
      categories={categories}
      brands={brands}
      onSave={async ({ images, ...payload }) => {
        const createdProduct = await createProductMutation.mutateAsync(payload)

        if (images.length > 0) {
          const imageResponse = await fetch(
            `/api/admin/products/${createdProduct.id}/images`,
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
        }
      }}
    />
  )
}
