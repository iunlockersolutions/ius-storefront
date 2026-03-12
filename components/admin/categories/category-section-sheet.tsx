"use client"

import { type ReactNode, useState } from "react"

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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"

interface CategorySectionSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  isDirty?: boolean
  isPending?: boolean
  children: ReactNode
  footer: ReactNode
}

export function CategorySectionSheet({
  open,
  onOpenChange,
  title,
  description,
  isDirty = false,
  isPending = false,
  children,
  footer,
}: CategorySectionSheetProps) {
  const isMobile = useIsMobile()
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true)
      return
    }

    if (isDirty && !isPending) {
      setShowDiscardConfirm(true)
      return
    }

    onOpenChange(false)
  }

  const handleDiscard = () => {
    setShowDiscardConfirm(false)
    onOpenChange(false)
  }

  return (
    <>
      {isMobile ? (
        <Drawer open={open} onOpenChange={handleOpenChange}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{title}</DrawerTitle>
              <DrawerDescription>{description}</DrawerDescription>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
            <DrawerFooter>
              <div className="flex flex-col-reverse gap-3">{footer}</div>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogContent className="flex max-h-[85vh] sm:max-w-2xl flex-col overflow-hidden p-0">
            <DialogHeader className="border-b px-6 py-5">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
            <div className="border-t bg-background px-6 py-4">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                {footer}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog
        open={showDiscardConfirm}
        onOpenChange={setShowDiscardConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Your unsaved edits will be lost if you close this drawer now.
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
