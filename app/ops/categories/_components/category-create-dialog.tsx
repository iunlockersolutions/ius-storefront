"use client"

import { useState } from "react"

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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"

import { NewCategoryForm } from "./new-category-form"

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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true)
      return
    }

    if (isSubmitting) {
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
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center px-5 py-8 sm:px-7">
          <AdminQueryLoadingState
            wrapperClassName="w-full max-w-3xl space-y-4"
            skeletonClassName="h-[640px] w-full"
          />
        </div>
      ) : errorMessage ? (
        <div className="flex flex-1 items-center justify-center px-5 py-8 sm:px-7">
          <div className="w-full max-w-xl">
            <AdminQueryErrorState message={errorMessage} onRetry={onRetry} />
          </div>
        </div>
      ) : (
        <NewCategoryForm
          categories={categories}
          onSuccess={() => {
            setHasUnsavedChanges(false)
            setIsSubmitting(false)
            onOpenChange(false)
          }}
          onCancel={() => handleOpenChange(false)}
          onDirtyChange={setHasUnsavedChanges}
          onSubmittingChange={setIsSubmitting}
        />
      )}
    </div>
  )

  return (
    <>
      {isMobile ? (
        <Drawer open={open} onOpenChange={handleOpenChange}>
          <DrawerContent className="mx-auto flex h-[92vh] max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden p-0">
            <DrawerHeader className="sr-only">
              <DrawerTitle>Create Category</DrawerTitle>
            </DrawerHeader>
            {content}
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogContent
            showCloseButton={false}
            className="flex h-[min(84vh,860px)] w-[72vw] max-w-[72vw] sm:max-w-4xl flex-col overflow-hidden p-0"
          >
            <DialogHeader className="sr-only">
              <DialogTitle>Create Category</DialogTitle>
            </DialogHeader>
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
