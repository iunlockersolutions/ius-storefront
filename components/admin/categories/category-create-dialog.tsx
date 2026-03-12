"use client"

import { useState } from "react"

import { NewCategoryForm } from "@/components/admin/categories/new-category-form"
import {
  AdminQueryErrorState,
  AdminQueryLoadingState,
} from "@/components/admin/query-state"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"

interface CategoryCreateDialogCategory {
  id: string
  name: string
  slug: string
  level: number
  path: string
}

interface CategoryCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: CategoryCreateDialogCategory[]
  isLoading?: boolean
  errorMessage?: string | null
  onRetry?: () => Promise<unknown>
}

export function CategoryCreateDialog({
  open,
  onOpenChange,
  categories,
  isLoading = false,
  errorMessage = null,
  onRetry,
}: CategoryCreateDialogProps) {
  const isMobile = useIsMobile()
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true)
      return
    }

    if (hasUnsavedChanges) {
      setShowDiscardConfirm(true)
      return
    }

    onOpenChange(false)
  }

  const handleDiscard = () => {
    setShowDiscardConfirm(false)
    setHasUnsavedChanges(false)
    onOpenChange(false)
  }

  const content = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        {isLoading ? (
          <AdminQueryLoadingState
            wrapperClassName="space-y-4"
            skeletonClassName="h-96 w-full"
          />
        ) : errorMessage ? (
          <AdminQueryErrorState message={errorMessage} onRetry={onRetry} />
        ) : (
          <NewCategoryForm
            categories={categories}
            onSuccess={() => {
              setHasUnsavedChanges(false)
              onOpenChange(false)
            }}
            onCancel={() => handleOpenChange(false)}
            onDirtyChange={setHasUnsavedChanges}
          />
        )}
      </div>
    </div>
  )

  return (
    <>
      {isMobile ? (
        <Sheet open={open} onOpenChange={handleOpenChange}>
          <SheetContent className="flex h-full w-full max-w-none flex-col overflow-hidden p-0 sm:max-w-none">
            <div className="border-b bg-background px-6 py-5">
              <SheetTitle>Create Category</SheetTitle>
              <SheetDescription>
                Add category basics, variant names, and storefront settings in
                one guided flow.
              </SheetDescription>
            </div>
            {content}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogContent className="flex h-[min(90vh,820px)] sm:max-w-5xl flex-col overflow-hidden p-0">
            <div className="border-b bg-background px-6 py-5">
              <DialogTitle>Create Category</DialogTitle>
              <DialogDescription>
                Add category basics, variant names, and storefront settings in
                one guided flow.
              </DialogDescription>
            </div>
            {content}
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog
        open={showDiscardConfirm}
        onOpenChange={setShowDiscardConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard category draft?</AlertDialogTitle>
            <AlertDialogDescription>
              Your unsaved category details will be lost if you close this
              dialog now.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscard} variant="destructive">
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
