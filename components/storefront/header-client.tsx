"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { ArrowRight, Heart, LogOut, Search, User } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { clearAuthCookies } from "@/lib/actions/admin-auth"
import { authClient } from "@/lib/auth-client"
import { type StorefrontNavigationData } from "@/lib/storefront/navigation"

import { CartBadge } from "./cart-badge"
import { MobileNav } from "./mobile-nav"
import { SearchDialog } from "./search-dialog"
import { StorefrontDesktopNavigation } from "./storefront-desktop-navigation"

interface StorefrontHeaderClientProps {
  isAuthenticated?: boolean
  navigation: StorefrontNavigationData
  user?: {
    name?: string | null
    email: string
    image?: string | null
  }
}

export function StorefrontHeaderClient({
  isAuthenticated = false,
  navigation,
  user,
}: StorefrontHeaderClientProps) {
  const router = useRouter()
  const [searchOpen, setSearchOpen] = React.useState(false)
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((name) => name[0])
        .join("")
        .toUpperCase()
    : user?.email[0]?.toUpperCase() || "U"

  const handleSignOut = async () => {
    await clearAuthCookies()
    await authClient.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <SidebarProvider mobileBreakpoint={1024} unstyled>
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="border-b bg-muted/30">
          <div className="container mx-auto flex items-center justify-between px-4 py-2 text-xs text-muted-foreground">
            <p className="truncate pr-4">
              New arrivals across phones, audio, and power accessories.
            </p>
            <div className="ml-auto flex shrink-0 items-center gap-4">
              <Link
                href="/deals"
                className="transition-colors hover:text-foreground"
              >
                Shop deals
              </Link>
              <Link
                href="/categories"
                className="hidden transition-colors hover:text-foreground sm:block"
              >
                Browse categories
              </Link>
            </div>
          </div>
        </div>

        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <span className="text-lg font-semibold tracking-tight">
              IUS Shop
            </span>
          </Link>

          <div className="hidden min-w-0 flex-1 lg:block">
            <StorefrontDesktopNavigation navigation={navigation} />
          </div>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <Search className="size-5" />
              <span className="sr-only">Search</span>
            </Button>

            {isAuthenticated ? (
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="hidden sm:inline-flex"
              >
                <Link href="/favorites">
                  <Heart className="size-5" />
                  <span className="sr-only">Favorites</span>
                </Link>
              </Button>
            ) : null}

            <CartBadge />

            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="hidden size-10 sm:inline-flex"
                  >
                    <Avatar className="size-9">
                      <AvatarImage
                        src={user.image || undefined}
                        alt={user.name || user.email}
                      />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">
                        {user.name || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/orders" className="cursor-pointer">
                      My Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/favorites" className="cursor-pointer">
                      Favorites
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 size-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer"
                  >
                    <LogOut className="mr-2 size-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="default"
                size="sm"
                asChild
                className="hidden sm:inline-flex"
              >
                <Link href="/auth/login">
                  Latest deals
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            )}

            <SidebarTrigger variant="ghost" size="icon" className="lg:hidden" />
          </div>
        </div>
      </header>

      <MobileNav
        isAuthenticated={isAuthenticated}
        navigation={navigation}
        onSignOut={handleSignOut}
        userEmail={user?.email}
        userName={user?.name}
      />
      <SearchDialog isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </SidebarProvider>
  )
}
