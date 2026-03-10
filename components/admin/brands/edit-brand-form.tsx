"use client"

import { BrandEditorForm } from "@/components/admin/brands/brand-editor-form"
import {
  useDeleteBrandMutation,
  useUpdateBrandMutation,
} from "@/hooks/admin/use-brand-mutations"

interface EditBrandFormProps {
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
  }
}

export function EditBrandForm({ brand }: EditBrandFormProps) {
  const updateBrandMutation = useUpdateBrandMutation(brand.id)
  const deleteBrandMutation = useDeleteBrandMutation()

  return (
    <BrandEditorForm
      mode="edit"
      initialData={brand}
      onSave={(payload) => updateBrandMutation.mutateAsync(payload)}
      onDelete={() => deleteBrandMutation.mutateAsync(brand.id)}
    />
  )
}
