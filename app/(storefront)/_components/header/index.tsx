import Link from "next/link"

import { ArrowRight, Heart } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { routes } from "@/configs/routes"
import { getServerSession } from "@/lib/auth/rbac"
import { getStorefrontNavigationData } from "@/lib/storefront/navigation"

import { CartBadge } from "./cart-badge"
import { DesktopNavigation } from "./desktop-navigation"
import { MobileNavigation } from "./mobile-navigation"
import ProfileMenu from "./profile-menu"
import TopBar from "./top-bar"

type HeaderProps = {
  isAuthenticated?: boolean
}

async function Header({ isAuthenticated = false }: HeaderProps) {
  const navigation = await getStorefrontNavigationData()
  const session = await getServerSession()
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
      <>
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
          {user?.role === "admin" ? <TopBar /> : null}
          <div className="container mx-auto flex h-16 items-center gap-4 px-4">
            <Link
              href={routes.storefront.root}
              className="flex shrink-0 items-center gap-3"
            >
              <span className="text-lg font-semibold tracking-tight">
                IUS Shop
              </span>
            </Link>

            <DesktopNavigation navigation={navigation} />

            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              {isAuthenticated ? (
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="hidden sm:inline-flex"
                >
                  <Link href={routes.storefront.favorites.root}>
                    <Heart className="size-5" />
                    <span className="sr-only">Favorites</span>
                  </Link>
                </Button>
              ) : null}

              <CartBadge />

              {isAuthenticated && user ? (
                <ProfileMenu user={user} />
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  asChild
                  className="hidden sm:inline-flex"
                >
                  <Link href={routes.auth.login}>
                    Sign in
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              )}

              <SidebarTrigger
                variant="ghost"
                size="icon"
                className="lg:hidden"
              />
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
    </>
  )
}

export default Header
