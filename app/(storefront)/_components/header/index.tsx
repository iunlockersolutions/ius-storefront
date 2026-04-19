import Link from "next/link"

import { Heart } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { routes } from "@/configs/routes"
import { getServerSession } from "@/lib/auth/rbac"
import { getStorefrontNavigationData } from "@/lib/storefront/navigation"

import { CartBadge } from "./cart-badge"
import { DesktopNavigation } from "./desktop-navigation"
import { GuestHeaderActions } from "./guest-header-actions"
import { MobileNavigation } from "./mobile-navigation"
import ProfileMenu from "./profile-menu"
import TopBar from "./top-bar"

type HeaderProps = {
  isAuthenticated?: boolean
}

async function Header({ isAuthenticated = false }: HeaderProps) {
  const [navigation, session] = await Promise.all([
    getStorefrontNavigationData(),
    getServerSession(),
  ])
  const user = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        role: session.user.role,
      }
    : undefined

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        {user?.role === "admin" ? <TopBar /> : null}
        <div className="container mx-auto flex h-16 items-center gap-3 px-4 lg:gap-6">
          <Link
            href={routes.storefront.root}
            className="flex shrink-0 items-center gap-3"
          >
            <span className="text-lg font-semibold tracking-tight">EvoluX</span>
          </Link>

          <div className="hidden min-w-0 flex-1 lg:flex">
            <DesktopNavigation navigation={navigation} />
          </div>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <SidebarTrigger variant="ghost" size="icon" className="lg:hidden" />

            <CartBadge />

            {isAuthenticated ? (
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="hidden lg:inline-flex"
              >
                <Link href={routes.storefront.favorites.root}>
                  <Heart className="size-5" />
                  <span className="sr-only">Favorites</span>
                </Link>
              </Button>
            ) : null}

            {isAuthenticated && user ? (
              <div className="hidden lg:block">
                <ProfileMenu user={user} />
              </div>
            ) : (
              <div className="hidden lg:flex lg:items-center">
                <GuestHeaderActions />
              </div>
            )}
          </div>
        </div>
      </header>

      <MobileNavigation
        isAuthenticated={isAuthenticated}
        navigation={navigation}
        userEmail={user?.email}
        userName={user?.name}
      />
    </>
  )
}

export default Header
