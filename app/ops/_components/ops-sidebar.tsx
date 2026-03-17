"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { ArrowLeft } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

import {
  isOpsNavItemActive,
  opsNavGroups,
  type OpsNavItem,
} from "./ops-navigation"

function NavLink({ item, pathname }: { item: OpsNavItem; pathname: string }) {
  const { isMobile, setOpenMobile } = useSidebar()
  const isActive = isOpsNavItemActive(item, pathname)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        tooltip={item.title}
        isActive={isActive}
        className={cn(
          "text-sidebar-foreground/80 hover:text-sidebar-foreground",
          isActive && "bg-sidebar-accent text-sidebar-foreground",
        )}
      >
        <Link
          href={item.href}
          onClick={() => {
            if (isMobile) {
              setOpenMobile(false)
            }
          }}
        >
          <item.icon />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function OpsSidebar() {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/70">
      <SidebarHeader className="gap-3 border-b border-sidebar-border/70 px-3 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              tooltip="IUS Ops"
              className="h-12 rounded-xl"
            >
              <Link
                href="/ops"
                onClick={() => {
                  if (isMobile) {
                    setOpenMobile(false)
                  }
                }}
              >
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg text-sm font-semibold">
                  I
                </div>
                <div className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold text-sidebar-foreground">
                    IUS Ops
                  </span>
                  <span className="truncate text-xs text-sidebar-foreground/65">
                    Storefront admin
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {opsNavGroups.map((group, index) => (
          <div key={group.title}>
            {index > 0 ? <SidebarSeparator /> : null}
            <SidebarGroup className="px-3 py-3">
              <SidebarGroupLabel className="px-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/50">
                {group.title}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <NavLink key={item.href} item={item} pathname={pathname} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/70 px-3 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Back to Store">
              <Link
                href="/"
                onClick={() => {
                  if (isMobile) {
                    setOpenMobile(false)
                  }
                }}
              >
                <ArrowLeft />
                <span>Back to Store</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

export default OpsSidebar
