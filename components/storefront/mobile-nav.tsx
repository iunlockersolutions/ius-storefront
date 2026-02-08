"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import {
  ChevronRight,
  Grid3X3,
  Heart,
  Home,
  LogIn,
  LogOut,
  Package,
  ShoppingBag,
  Tag,
  User,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { clearAuthCookies } from "@/lib/actions/admin-auth"
import { signOut } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
  isAuthenticated?: boolean
  userName?: string | null
}

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/products", label: "Products", icon: Package },
  { href: "/categories", label: "Categories", icon: Grid3X3 },
  { href: "/deals", label: "Deals", icon: Tag },
]

const accountLinks = [
  { href: "/orders", label: "My Orders", icon: ShoppingBag },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/profile", label: "Profile", icon: User },
]

export function MobileNav({
  isOpen,
  onClose,
  isAuthenticated = false,
  userName,
}: MobileNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    onClose()
    await clearAuthCookies()
    await signOut()
    router.push("/")
    router.refresh()
  }

  // Close on route change
  useEffect(() => {
    onClose()
  }, [pathname, onClose])

  // Prevent scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 z-50 w-full max-w-xs bg-white dark:bg-neutral-950 shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4">
            <Link href="/" className="text-xl font-bold" onClick={onClose}>
              IUS Shop
            </Link>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Main Navigation */}
            <nav className="p-4">
              <div className="space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon
                  const isActive = pathname === link.href
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {link.label}
                    </Link>
                  )
                })}
              </div>
            </nav>

            {/* Account Section */}
            <div className="border-t p-4">
              {isAuthenticated ? (
                <>
                  <div className="mb-3 px-3">
                    <p className="text-xs text-muted-foreground">
                      Signed in as
                    </p>
                    <p className="font-medium truncate">{userName || "User"}</p>
                  </div>
                  <div className="space-y-1">
                    {accountLinks.map((link) => {
                      const Icon = link.icon
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={onClose}
                          className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
                        >
                          <span className="flex items-center gap-3">
                            <Icon className="h-5 w-5" />
                            {link.label}
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      )
                    })}
                    {/* Sign Out */}
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors text-destructive"
                    >
                      <span className="flex items-center gap-3">
                        <LogOut className="h-5 w-5" />
                        Sign Out
                      </span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Button asChild className="w-full">
                    <Link href="/auth/login" onClick={onClose}>
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/auth/register" onClick={onClose}>
                      Create Account
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t p-4 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} IUS Shop. All rights reserved.
          </div>
        </div>
      </div>
    </>
  )
}
