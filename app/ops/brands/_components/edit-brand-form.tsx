"use client"

import { BrandEditorForm } from "@/app/ops/brands/_components/brand-editor-form"
import {
  useDeleteBrandMutation,
  useUpdateBrandMutation,
} from "@/services/mutations/use-brand-mutations"

interface EditBrandFormProps {
  categories: Array<{
    id: string
    name: string
    slug: string
  }>
  brand: {
    id: string
    name: string
    slug: string
    description: string | null
    logo: string | null
    websiteUrl: string | null
    isActive: boolean
    sortOrder: number
    metaTitle: string | null
    metaDescription: string | null
    productCount: number
    modelCount?: number
    categoryAssignments: Array<{
      categoryId: string
      navPriority: number
      showInProductMenu: boolean
    }>
  }
}

export function EditBrandForm({ categories, brand }: EditBrandFormProps) {
  const updateBrandMutation = useUpdateBrandMutation(brand.id)
  const deleteBrandMutation = useDeleteBrandMutation()

  return (
    <BrandEditorForm
      mode="edit"
      categories={categories}
      initialData={brand}
      onSave={(payload) => updateBrandMutation.mutateAsync(payload)}
      onDelete={() => deleteBrandMutation.mutateAsync(brand.id)}
    />
  )
}
