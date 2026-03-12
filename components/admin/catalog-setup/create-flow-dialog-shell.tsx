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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Drawer, DrawerContent } from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"

interface CreateFlowDialogShellProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isDirty: boolean
  isSubmitting: boolean
  dialogTitle: string
  discardTitle: string
  discardDescription: string
  children: (controls: { requestClose: () => void }) => ReactNode
}

export function CreateFlowDialogShell({
  open,
  onOpenChange,
  isDirty,
  isSubmitting,
  dialogTitle,
  discardTitle,
  discardDescription,
  children,
}: CreateFlowDialogShellProps) {
  const isMobile = useIsMobile()
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true)
      return
    }

    if (isSubmitting) {
      return
    }

    if (isDirty) {
      setShowDiscardConfirm(true)
      return
    }

    onOpenChange(false)
  }

  const handleDiscard = () => {
    setShowDiscardConfirm(false)
    onOpenChange(false)
  }

  const requestClose = () => {
    handleOpenChange(false)
  }

  return (
    <>
      {isMobile ? (
        <Drawer open={open} onOpenChange={handleOpenChange}>
          <DrawerContent className="mx-auto flex h-[92vh] max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden p-0">
            {children({ requestClose })}
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogContent
            showCloseButton={false}
            className="flex h-[min(84vh,860px)] w-[72vw] max-w-[72vw] sm:max-w-4xl flex-col overflow-hidden p-0"
          >
            <DialogHeader className="sr-only">
              <DialogTitle>{dialogTitle}</DialogTitle>
            </DialogHeader>
            {children({ requestClose })}
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog
        open={showDiscardConfirm}
        onOpenChange={setShowDiscardConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{discardTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {discardDescription}
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
