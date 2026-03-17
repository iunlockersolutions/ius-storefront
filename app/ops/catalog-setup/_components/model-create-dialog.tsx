"use client"

import { useState } from "react"

import { NewProductModelGroupWizardForm } from "@/app/ops/product-model-groups/_components/new-product-model-group-wizard-form"

import { CreateFlowDialogShell } from "./create-flow-dialog-shell"

interface ModelCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Array<{
    id: string
    name: string
    slug: string
  }>
  brands: Array<{
    id: string
    name: string
    slug: string
    categoryAssignments: Array<{
      categoryId: string
    }>
  }>
}

export function ModelCreateDialog({
  open,
  onOpenChange,
  categories,
  brands,
}: ModelCreateDialogProps) {
  const [isDirty, setIsDirty] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <CreateFlowDialogShell
      open={open}
      onOpenChange={onOpenChange}
      isDirty={isDirty}
      isSubmitting={isSubmitting}
      dialogTitle="Create Model"
      discardTitle="Discard model draft?"
      discardDescription="Your unsaved model details will be lost if you close this dialog now."
    >
      {({ requestClose }) => (
        <NewProductModelGroupWizardForm
          categories={categories}
          brands={brands}
          onSuccess={() => {
            setIsDirty(false)
            setIsSubmitting(false)
            onOpenChange(false)
          }}
          onCancel={requestClose}
          onDirtyChange={setIsDirty}
          onSubmittingChange={setIsSubmitting}
        />
      )}
    </CreateFlowDialogShell>
  )
}
