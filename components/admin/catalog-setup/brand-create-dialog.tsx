"use client"

import { useState } from "react"

import { NewBrandWizardForm } from "@/components/admin/brands/new-brand-wizard-form"
import { CreateFlowDialogShell } from "@/components/admin/catalog-setup/create-flow-dialog-shell"

interface BrandCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Array<{
    id: string
    name: string
    slug: string
  }>
}

export function BrandCreateDialog({
  open,
  onOpenChange,
  categories,
}: BrandCreateDialogProps) {
  const [isDirty, setIsDirty] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <CreateFlowDialogShell
      open={open}
      onOpenChange={onOpenChange}
      isDirty={isDirty}
      isSubmitting={isSubmitting}
      discardTitle="Discard brand draft?"
      discardDescription="Your unsaved brand details will be lost if you close this dialog now."
    >
      {({ requestClose }) => (
        <NewBrandWizardForm
          categories={categories}
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
