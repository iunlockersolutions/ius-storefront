"use client"

import { ProductEditorForm } from "@/components/admin/products/product-editor-form"
import { useDeleteProductMutation } from "@/hooks/admin/use-delete-product-mutation"
import {
  useUpdateProductImagesMutation,
  useUpdateProductMutation,
} from "@/hooks/admin/use-update-product-mutations"

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

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  shortDescription: string | null
  brandId: string | null
  primaryCategoryId: string | null
  modelId: string | null
  status: "draft" | "active" | "archived"
  isFeatured: boolean
  metaTitle: string | null
  metaDescription: string | null
  categories: Array<{ id: string }>
  options: Array<{
    id: string
    name: string
    values: Array<{
      id: string
      value: string
    }>
  }>
  variants: Array<{
    id: string
    sku: string
    name: string
    price: string
    compareAtPrice: string | null
    costPrice: string | null
    weight: string | null
    isDefault: boolean
    isActive: boolean
    inventory?: {
      quantity: number
      reservedQuantity: number
      lowStockThreshold: number | null
    } | null
    selections?: Array<{
      optionName: string
      optionValue: string
    }>
  }>
}

interface ProductImage {
  id: string
  url: string
  altText: string | null
  variantId?: string | null
  isPrimary: boolean
}

const EMPTY_IMAGES: ProductImage[] = []

interface EditProductFormProps {
  product: Product
  categories: Category[]
  brands: Brand[]
  models: Model[]
  images?: ProductImage[]
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
    />
  )
}
