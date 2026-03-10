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
  level: number
  path: string
}

interface Brand {
  id: string
  name: string
  slug: string
}

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  shortDescription: string | null
  brandId: string | null
  primaryCategoryId: string | null
  basePrice: string
  compareAtPrice: string | null
  costPrice: string | null
  status: "draft" | "active" | "archived"
  isFeatured: boolean
  metaTitle: string | null
  metaDescription: string | null
  categories: Array<{ id: string }>
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
  }>
}

interface ProductImage {
  id: string
  url: string
  altText: string | null
  isPrimary: boolean
}

interface EditProductFormProps {
  product: Product
  categories: Category[]
  brands: Brand[]
  images?: ProductImage[]
}

export function EditProductForm({
  product,
  categories,
  brands,
  images = [],
}: EditProductFormProps) {
  const updateProductMutation = useUpdateProductMutation(product.id)
  const updateProductImagesMutation = useUpdateProductImagesMutation(product.id)
  const deleteProductMutation = useDeleteProductMutation()

  return (
    <ProductEditorForm
      mode="edit"
      categories={categories}
      brands={brands}
      initialData={{
        ...product,
        images,
      }}
      onSave={async ({ images: nextImages, ...payload }) => {
        await updateProductMutation.mutateAsync(payload)
        await updateProductImagesMutation.mutateAsync(nextImages)
      }}
      onDelete={async () => {
        await deleteProductMutation.mutateAsync(product.id)
      }}
    />
  )
}
