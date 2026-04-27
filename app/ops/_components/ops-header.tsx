"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import { LogOut, Settings, User } from "lucide-react"

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { clearAuthCookies } from "@/lib/actions/admin-auth"
import { authClient } from "@/lib/auth-client"

import { getOpsPageHeading } from "./ops-navigation"
import { OpsNotificationBell } from "./ops-notification-bell"

type OpsHeaderProps = {
  user: {
    id: string
    email: string
    name?: string | null
    image?: string | null
  }
}

function OpsHeader({ user }: OpsHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const heading = getOpsPageHeading(pathname)

  const initials = user.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
    : user.email[0]?.toUpperCase() || "U"

  async function handleSignOut() {
    await clearAuthCookies()
    await authClient.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <header className="supports-backdrop-filter:bg-background/75 sticky top-0 z-30 flex h-16 shrink-0 items-center border-b border-border/60 bg-background/90 backdrop-blur-xl transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-16">
      <div className="flex w-full items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="hidden h-4 md:block data-[orientation=vertical]:h-4"
          />
          <div className="min-w-0">
            <Breadcrumb className="hidden md:block">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {heading.eyebrow}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <p className="truncate text-sm font-semibold text-foreground sm:text-base">
              {heading.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right md:block">
            <p className="truncate text-sm font-medium text-foreground">
              {user.name || "User"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>

          <AnimatedThemeToggler />

          <OpsNotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full border border-border/70 bg-background/70"
                aria-label="Open profile menu"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={user.image || undefined}
                    alt={user.name || user.email}
                  />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.name || "User"}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/ops/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/ops/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
export default OpsHeader
