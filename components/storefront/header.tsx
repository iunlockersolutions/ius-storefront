"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Heart, LogOut, Menu, Package, Search, User } from "lucide-react"

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
import { clearAuthCookies } from "@/lib/actions/admin-auth"
import { signOut } from "@/lib/auth-client"

import { CartBadge } from "./cart-badge"
import { MobileNav } from "./mobile-nav"
import { SearchDialog } from "./search-dialog"

interface StorefrontHeaderProps {
  isAuthenticated?: boolean
  user?: {
    name?: string | null
    email: string
    image?: string | null
  }
}

/**
 * Storefront Header
 *
 * Navigation header for the storefront.
 */
export function StorefrontHeader({
  isAuthenticated = false,
  user,
}: StorefrontHeaderProps) {
  const router = useRouter()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const handleSignOut = async () => {
    await clearAuthCookies()
    await signOut()
    router.push("/")
    router.refresh()
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "U"

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-neutral-950/95 dark:supports-[backdrop-filter]:bg-neutral-950/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">IUS Shop</span>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/products"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Products
            </Link>
            <Link
              href="/categories"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Categories
            </Link>
            <Link
              href="/deals"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Deals
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Search */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>

            {/* Favorites - Desktop only */}
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="hidden sm:flex"
              >
                <Link href="/favorites">
                  <Heart className="h-5 w-5" />
                  <span className="sr-only">Favorites</span>
                </Link>
              </Button>
            )}

            {/* Cart */}
            <CartBadge />

            {/* Account - with dropdown for authenticated users */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full hidden sm:flex"
                  >
                    <Avatar className="h-8 w-8">
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
                      <Package className="h-4 w-4 mr-2" />
                      My Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/favorites" className="cursor-pointer">
                      <Heart className="h-4 w-4 mr-2" />
                      Favorites
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hidden sm:flex"
              >
                <Link href="/auth/login">Sign In</Link>
              </Button>
            )}

            {/* Mobile Menu */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menu</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        isAuthenticated={isAuthenticated}
        userName={user?.name}
      />

      {/* Search Dialog */}
      <SearchDialog isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
