"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"

import {
  type GuestAuthPromptSource,
  useGuestAuthPrompt,
} from "@/components/auth/guest-auth-prompt"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { type StorefrontNavigationData } from "@/lib/storefront/navigation"

import {
  MobileBrandsView,
  MobileCategoriesView,
  MobileMenuView,
  MobileNavigationFooter,
  MobileNavigationHeader,
  MobileProductsView,
} from "./mobile-navigation-sections"
import { type MobileNavigationView } from "./types"
import { useStorefrontProductNavigation } from "./use-storefront-product-navigation"
import { useStorefrontSignOut } from "./use-storefront-sign-out"

interface MobileNavProps {
  isAuthenticated?: boolean
  navigation: StorefrontNavigationData
  userEmail?: string
  userName?: string | null
}

export function MobileNavigation({
  isAuthenticated = false,
  navigation,
  userEmail,
  userName,
}: MobileNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { setOpenMobile } = useSidebar()
  const { open } = useGuestAuthPrompt()
  const signOut = useStorefrontSignOut()
  const [view, setView] = React.useState<MobileNavigationView>("categories")
  const { activeBrand, activeCategory, reset, selectBrand, selectCategory } =
    useStorefrontProductNavigation(navigation)

  const closeNav = React.useCallback(() => {
    setView("categories")
    reset()
    setOpenMobile(false)
  }, [reset, setOpenMobile])

  const handleProtectedNavigation = React.useCallback(
    (href: string) => {
      closeNav()
      router.push(href)
    },
    [closeNav, router],
  )

  const handleGuestAuthOpen = React.useCallback(
    (callbackUrl: string, source: GuestAuthPromptSource) => {
      closeNav()
      window.setTimeout(() => {
        open({ callbackUrl, source })
      }, 0)
    },
    [closeNav, open],
  )

  const handleCategorySelect = React.useCallback(
    (categorySlug: string) => {
      selectCategory(categorySlug)
      setView("brands")
    },
    [selectCategory],
  )

  const handleBrandSelect = React.useCallback(
    (brandId: string) => {
      selectBrand(brandId)
      setView("products")
    },
    [selectBrand],
  )

  const handleSignOut = React.useCallback(async () => {
    closeNav()
    await signOut()
  }, [closeNav, signOut])

  return (
    <div className="lg:hidden">
      <Sidebar side="left" variant="sidebar" collapsible="offcanvas">
        <SidebarHeader className="border-b bg-background px-0 py-0">
          <MobileNavigationHeader
            onClose={closeNav}
            onViewChange={setView}
            view={view}
          />
        </SidebarHeader>

        <SidebarContent>
          {view === "menu" ? (
            <>
              <MobileMenuView
                navigation={navigation}
                onNavigate={closeNav}
                pathname={pathname}
              />
              <SidebarSeparator />
            </>
          ) : null}

          {view === "categories" ? (
            <MobileCategoriesView
              categories={navigation.productCategories}
              onSelectCategory={handleCategorySelect}
            />
          ) : null}

          {view === "brands" ? (
            <MobileBrandsView
              activeCategory={activeCategory}
              onBack={() => setView("categories")}
              onNavigate={closeNav}
              onSelectBrand={handleBrandSelect}
            />
          ) : null}

          {view === "products" ? (
            <MobileProductsView
              activeBrand={activeBrand}
              activeCategory={activeCategory}
              onBack={() => setView("brands")}
              onNavigate={closeNav}
            />
          ) : null}
        </SidebarContent>

        <SidebarFooter className="border-t px-0 py-0">
          <MobileNavigationFooter
            isAuthenticated={isAuthenticated}
            onGuestAuthOpen={handleGuestAuthOpen}
            onProtectedNavigate={handleProtectedNavigation}
            onSignOut={handleSignOut}
            userEmail={userEmail}
            userName={userName}
            view={view}
          />
        </SidebarFooter>
      </Sidebar>
    </div>
  )
}
