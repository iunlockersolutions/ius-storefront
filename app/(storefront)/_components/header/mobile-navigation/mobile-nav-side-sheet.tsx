"use client"

import * as React from "react"

import { X } from "lucide-react"

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"

type MobileNavSideSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  ariaLabel: string
  children: React.ReactNode
}

export function MobileNavSideSheet({
  open,
  onOpenChange,
  ariaLabel,
  children,
}: MobileNavSideSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        showCloseButton={false}
        aria-label={ariaLabel}
        className="flex h-dvh flex-col gap-0 bg-white p-0 data-[side=left]:w-full data-[side=left]:sm:max-w-none"
      >
        <SheetTitle className="sr-only">{ariaLabel}</SheetTitle>
        <SheetDescription className="sr-only">{ariaLabel}</SheetDescription>

        <div className="flex h-14 items-center justify-between border-b border-neutral-200 px-4">
          <span className="text-base font-semibold tracking-tight">
            Evolu<span className="text-indigo-600">X</span>
          </span>
          <SheetClose
            aria-label="Close"
            className="inline-flex size-10 items-center justify-center text-neutral-700"
          >
            <X className="size-5" />
          </SheetClose>
        </div>

        {children}
      </SheetContent>
    </Sheet>
  )
}
