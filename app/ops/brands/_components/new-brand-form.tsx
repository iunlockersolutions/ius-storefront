"use client"

import { BrandEditorForm } from "@/app/ops/brands/_components/brand-editor-form"
import { useCreateBrandMutation } from "@/services/mutations/use-brand-mutations"

interface NewBrandFormProps {
  categories: Array<{
    id: string
    name: string
    slug: string
  }>
}

export function NewBrandForm({ categories }: NewBrandFormProps) {
  const createBrandMutation = useCreateBrandMutation()

  return (
    <BrandEditorForm
      mode="create"
      categories={categories}
      onSave={(payload) => createBrandMutation.mutateAsync(payload)}
    />
  )
}
