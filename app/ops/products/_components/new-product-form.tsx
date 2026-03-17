"use client"

import type { AdminProductDetail } from "@/lib/types/admin-product"

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
  return (
    <ProductEditorForm
      categories={categories}
      brands={brands}
      models={models}
      initialData={{
        id: "",
        name: "",
        slug: "",
        description: null,
        shortDescription: null,
        brandId: null,
        primaryCategoryId: null,
        modelId: null,
        status: "draft",
        draftStep: "basics",
        isFeatured: false,
        inventoryTrackingMode: "quantity",
        receiptIdentifierTypes: [],
        metaTitle: null,
        metaDescription: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        categories: [],
        options: [],
        variants: [],
        media: [],
        workflow: {
          canPublish: false,
          errors: ["Save the draft to run final publish validation."],
        },
      }}
      onSave={async (productId, { media, ...payload }) => {
        const response = await fetch(
          productId
            ? `/api/admin/products/${productId}`
            : "/api/admin/products",
          {
            method: productId ? "PATCH" : "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          },
        )

        if (!response.ok) {
          const errorBody = await response.json().catch(() => null)
          throw new Error(
            errorBody?.error?.message ||
              errorBody?.error ||
              "Failed to save product draft",
          )
        }

        const body = await response.json()
        const savedProduct = (body.data ?? null) as AdminProductDetail | null

        if (!savedProduct?.id) {
          return savedProduct
        }

        const mediaResponse = await fetch(
          `/api/admin/products/${savedProduct.id}/media`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ media }),
          },
        )

        if (!mediaResponse.ok) {
          const errorBody = await mediaResponse.json().catch(() => null)
          throw new Error(
            errorBody?.error?.message ||
              errorBody?.error ||
              "Failed to save product media",
          )
        }

        const mediaBody = await mediaResponse.json()
        return {
          ...savedProduct,
          media: mediaBody.data ?? [],
        }
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
        return (body.data ?? null) as AdminProductDetail | null
      }}
    />
  )
}
