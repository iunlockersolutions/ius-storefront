"use client"

import type { ReactNode } from "react"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import AppHeader from "./app-header"
import AppSidebar from "./app-sidebar"
import { OpsRightRailProvider } from "./ops-right-rail-provider"
import { OpsRightRailSheet, OpsRightSidebar } from "./ops-right-sidebar"
import OpsRouteGuard from "./ops-route-guard"

interface OpsShellProps {
  children: ReactNode
  mustChangePassword: boolean
  user: {
    id: string
    email: string
    name?: string | null
    image?: string | null
  }
}

export default function OpsShell({
  children,
  mustChangePassword,
  user,
}: OpsShellProps) {
  return (
    <SidebarProvider>
      <OpsRightRailProvider>
        <AppSidebar />
        <SidebarInset className="max-h-svh min-h-svh overflow-hidden bg-white">
          <OpsRouteGuard mustChangePassword={mustChangePassword}>
            <AppHeader user={user} />
            <div className="flex-1 overflow-y-auto overscroll-none bg-white">
              <div className="mx-auto min-h-full w-full px-4 py-6 lg:px-6">
                {children}
              </div>
            </div>
          </OpsRouteGuard>
        </SidebarInset>
        <OpsRightSidebar />
        <OpsRightRailSheet />
      </OpsRightRailProvider>
    </SidebarProvider>
  )
}
