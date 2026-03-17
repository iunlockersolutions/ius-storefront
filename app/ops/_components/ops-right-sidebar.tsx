"use client"

import type * as React from "react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Sidebar } from "@/components/ui/sidebar"

import { useOpsRightRail } from "./ops-right-rail-provider"

export function OpsRightSidebar() {
  const { desktopContent, desktopWidth, isVisible } = useOpsRightRail()

  if (!isVisible || !desktopContent) {
    return null
  }

  return (
    <Sidebar
      side="right"
      collapsible="none"
      className="sticky top-0 hidden h-svh border-l border-sidebar-border/70 bg-background xl:flex"
      style={{ "--sidebar-width": desktopWidth } as React.CSSProperties}
    >
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        {desktopContent}
      </div>
    </Sidebar>
  )
}

export function OpsRightRailSheet() {
  const {
    closeMobileRail,
    isVisible,
    mobileContent,
    mobileDescription,
    mobileOpen,
    mobileTitle,
    openMobileRail,
  } = useOpsRightRail()

  if (!isVisible || !mobileContent) {
    return null
  }

  return (
    <Sheet
      open={mobileOpen}
      onOpenChange={(open) => {
        if (open) {
          openMobileRail()
        } else {
          closeMobileRail()
        }
      }}
    >
      <SheetContent side="right" className="w-full max-w-none p-0 sm:max-w-md">
        {mobileTitle || mobileDescription ? (
          <SheetHeader className="border-b border-border/70 px-5 py-4 text-left">
            {mobileTitle ? <SheetTitle>{mobileTitle}</SheetTitle> : null}
            {mobileDescription ? (
              <SheetDescription>{mobileDescription}</SheetDescription>
            ) : null}
          </SheetHeader>
        ) : null}
        <div className="min-h-0 flex-1 overflow-hidden">{mobileContent}</div>
      </SheetContent>
    </Sheet>
  )
}
