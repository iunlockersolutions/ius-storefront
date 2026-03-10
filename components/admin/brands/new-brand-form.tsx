"use client"

import { BrandEditorForm } from "@/components/admin/brands/brand-editor-form"
import { useCreateBrandMutation } from "@/hooks/admin/use-brand-mutations"

export function NewBrandForm() {
  const createBrandMutation = useCreateBrandMutation()

  return (
    <BrandEditorForm
      mode="create"
      onSave={(payload) => createBrandMutation.mutateAsync(payload)}
    />
  )
}
