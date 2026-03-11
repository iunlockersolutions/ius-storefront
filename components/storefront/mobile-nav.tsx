"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import {
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  Heart,
  Home,
  LogIn,
  LogOut,
  Package,
  ShoppingBag,
  Store,
  Tag,
  User,
} from "lucide-react"

import { Button } from "@/components/ui/button"
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
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type StorefrontNavigationData } from "@/lib/storefront/navigation"

interface MobileNavProps {
  isAuthenticated?: boolean
  navigation: StorefrontNavigationData
  onSignOut: () => Promise<void>
  userEmail?: string
  userName?: string | null
}

const rootNavLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/products", label: "Products", icon: Package },
  { href: "/categories", label: "Categories", icon: Grid3X3 },
  { href: "/brands", label: "Brands", icon: Store },
  { href: "/deals", label: "Deals", icon: Tag },
]

const accountLinks = [
  { href: "/orders", label: "My Orders", icon: ShoppingBag },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/profile", label: "Profile", icon: User },
]

export function MobileNav({
  isAuthenticated = false,
  navigation,
  onSignOut,
  userEmail,
  userName,
}: MobileNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { setOpenMobile } = useSidebar()
  const [view, setView] = React.useState<
    "brands" | "categories" | "menu" | "products"
  >("categories")
  const [activeCategorySlug, setActiveCategorySlug] = React.useState(
    navigation.productCategories[0]?.slug ?? null,
  )
  const [activeBrandId, setActiveBrandId] = React.useState<string | null>(
    navigation.productCategories[0]?.brands[0]?.id ?? null,
  )

  React.useEffect(() => {
    setView("categories")
  }, [pathname])

  const activeCategory =
    navigation.productCategories.find(
      (category) => category.slug === activeCategorySlug,
    ) ?? navigation.productCategories[0]

  React.useEffect(() => {
    const nextBrandId = activeCategory?.brands[0]?.id ?? null

    if (!activeCategory?.brands.some((brand) => brand.id === activeBrandId)) {
      setActiveBrandId(nextBrandId)
    }
  }, [activeBrandId, activeCategory])

  const activeBrand =
    activeCategory?.brands.find((brand) => brand.id === activeBrandId) ??
    activeCategory?.brands[0]

  const closeNav = () => setOpenMobile(false)

  const handleProtectedNavigation = (href: string) => {
    closeNav()
    router.push(href)
  }

  return (
    <div className="lg:hidden">
      <Sidebar side="left" variant="sidebar" collapsible="offcanvas">
        <SidebarHeader className="border-b bg-background px-0 py-0">
          <Tabs
            value={view === "menu" ? "menu" : "categories"}
            onValueChange={(value) =>
              setView(value === "menu" ? "menu" : "categories")
            }
            className="w-full"
          >
            <TabsList
              variant="line"
              className="grid h-12 w-full grid-cols-2 rounded-none bg-transparent p-0"
            >
              <TabsTrigger value="categories" className="rounded-none">
                All Categories
              </TabsTrigger>
              <TabsTrigger value="menu" className="rounded-none">
                Menu
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </SidebarHeader>

        <SidebarContent>
          {view === "menu" ? (
            <>
              <SidebarGroup className="px-0 pt-0">
                <SidebarGroupContent>
                  <SidebarMenu>
                    {rootNavLinks.map((link) => {
                      const Icon = link.icon

                      return (
                        <SidebarMenuItem key={link.href}>
                          <SidebarMenuButton
                            asChild
                            isActive={pathname === link.href}
                            className="h-12 rounded-none border-b px-4 text-sm"
                          >
                            <Link href={link.href} onClick={closeNav}>
                              <Icon />
                              <span>{link.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarSeparator />

              <SidebarGroup className="px-0 pb-0">
                <SidebarGroupLabel className="px-4 text-[11px] uppercase tracking-[0.18em] text-sidebar-foreground/60">
                  Featured brands
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <div className="space-y-0">
                    {navigation.brands.slice(0, 4).map((brand) => (
                      <Link
                        key={brand.id}
                        href={`/brands/${brand.slug}`}
                        onClick={closeNav}
                        className="flex items-center justify-between border-b px-4 py-3 text-sm transition-colors hover:bg-sidebar-accent"
                      >
                        <span className="min-w-0 truncate pr-4 font-medium">
                          {brand.name}
                        </span>
                        <span className="shrink-0 text-xs text-sidebar-foreground/70">
                          {brand.productCount}
                        </span>
                      </Link>
                    ))}
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>
            </>
          ) : view === "categories" ? (
            <SidebarGroup className="px-0 py-0">
              <SidebarGroupContent>
                <div className="space-y-0">
                  {navigation.productCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        setActiveCategorySlug(category.slug)
                        setActiveBrandId(
                          navigation.productCategories.find(
                            (item) => item.slug === category.slug,
                          )?.brands[0]?.id ?? null,
                        )
                        setView("brands")
                      }}
                      className="flex w-full items-center justify-between border-b px-4 py-4 text-left transition-colors hover:bg-sidebar-accent"
                    >
                      <div className="min-w-0 pr-4">
                        <span className="block truncate text-sm font-medium">
                          {category.name}
                        </span>
                        <span className="mt-1 block truncate text-xs text-muted-foreground">
                          Shop by brand
                        </span>
                      </div>
                      <ChevronRight className="size-4 shrink-0" />
                    </button>
                  ))}
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          ) : view === "brands" ? (
            <SidebarGroup className="px-0 py-0">
              <SidebarGroupContent>
                <div className="border-b">
                  <button
                    type="button"
                    onClick={() => setView("categories")}
                    className="flex w-full items-center gap-3 px-4 py-4 text-left text-sm font-medium transition-colors hover:bg-sidebar-accent"
                  >
                    <ChevronLeft className="size-4 shrink-0" />
                    <span className="truncate">Back to All Categories</span>
                  </button>
                </div>

                {activeCategory ? (
                  <>
                    <div className="border-b px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                            Category
                          </p>
                          <p className="mt-2 truncate text-sm font-semibold">
                            {activeCategory.name}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {activeCategory.description ||
                              "Select a brand to continue browsing products."}
                          </p>
                        </div>
                        <Link
                          href={`/products?category=${activeCategory.slug}`}
                          onClick={closeNav}
                          className="shrink-0 text-xs font-medium text-foreground hover:underline"
                        >
                          View all
                        </Link>
                      </div>
                    </div>

                    <div className="border-b px-4 py-3">
                      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        Brands
                      </p>
                    </div>
                    <div className="space-y-0">
                      {activeCategory.brands.length > 0 ? (
                        activeCategory.brands.map((brand) => (
                          <button
                            key={brand.id}
                            type="button"
                            onClick={() => {
                              setActiveBrandId(brand.id)
                              setView("products")
                            }}
                            className="flex w-full items-center justify-between border-b px-4 py-3 text-left transition-colors hover:bg-sidebar-accent"
                          >
                            <div className="min-w-0 pr-4">
                              <span className="block truncate text-sm font-medium">
                                {brand.name}
                              </span>
                              <span className="mt-1 block truncate text-xs text-muted-foreground">
                                {brand.models.length} models
                              </span>
                            </div>
                            <ChevronRight className="size-4 shrink-0" />
                          </button>
                        ))
                      ) : (
                        <p className="border-b px-4 py-3 text-sm text-muted-foreground">
                          No brands available.
                        </p>
                      )}
                    </div>
                  </>
                ) : null}
              </SidebarGroupContent>
            </SidebarGroup>
          ) : (
            <SidebarGroup className="px-0 py-0">
              <SidebarGroupContent>
                <div className="border-b">
                  <button
                    type="button"
                    onClick={() => setView("brands")}
                    className="flex w-full items-center gap-3 px-4 py-4 text-left text-sm font-medium transition-colors hover:bg-sidebar-accent"
                  >
                    <ChevronLeft className="size-4 shrink-0" />
                    <span className="truncate">Back to Brands</span>
                  </button>
                </div>

                {activeCategory && activeBrand ? (
                  <>
                    <div className="border-b px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                            {activeCategory.name}
                          </p>
                          <p className="mt-2 truncate text-sm font-semibold">
                            {activeBrand.name}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Browse products in this brand.
                          </p>
                        </div>
                        <Link
                          href={activeBrand.href}
                          onClick={closeNav}
                          className="shrink-0 text-xs font-medium text-foreground hover:underline"
                        >
                          View all
                        </Link>
                      </div>
                    </div>

                    <div className="border-b px-4 py-3">
                      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        Products
                      </p>
                    </div>
                    <div className="space-y-0">
                      {activeBrand.models.length > 0 ? (
                        activeBrand.models.map((model) => (
                          <Link
                            key={model.id}
                            href={model.href}
                            onClick={closeNav}
                            className="flex items-center justify-between border-b px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
                          >
                            <span className="min-w-0 truncate pr-4">
                              {model.name}
                            </span>
                            <ChevronRight className="size-4 shrink-0 text-sidebar-foreground/50" />
                          </Link>
                        ))
                      ) : (
                        <p className="border-b px-4 py-3 text-sm text-muted-foreground">
                          No products available.
                        </p>
                      )}
                    </div>
                  </>
                ) : null}
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter className="border-t px-0 py-0">
          {view === "menu" ? (
            isAuthenticated ? (
              <>
                <div className="border-b px-4 py-4">
                  <p className="text-xs text-sidebar-foreground/70">
                    Signed in as
                  </p>
                  <p className="truncate text-sm font-medium">
                    {userName || userEmail || "Customer"}
                  </p>
                </div>
                <div className="space-y-0">
                  {accountLinks.map((link) => {
                    const Icon = link.icon

                    return (
                      <button
                        key={link.href}
                        type="button"
                        onClick={() => handleProtectedNavigation(link.href)}
                        className="flex w-full items-center justify-between border-b px-4 py-3 text-sm transition-colors hover:bg-sidebar-accent"
                      >
                        <span className="flex min-w-0 items-center gap-3 pr-4">
                          <Icon className="size-4 shrink-0" />
                          <span className="truncate">{link.label}</span>
                        </span>
                        <ChevronRight className="size-4 shrink-0 text-sidebar-foreground/70" />
                      </button>
                    )
                  })}

                  <button
                    type="button"
                    onClick={async () => {
                      closeNav()
                      await onSignOut()
                    }}
                    className="flex w-full items-center justify-between px-4 py-3 text-sm text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <span className="flex items-center gap-3">
                      <LogOut className="size-4" />
                      Sign out
                    </span>
                  </button>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-0">
                <Button
                  asChild
                  variant="ghost"
                  className="h-12 rounded-none border-r"
                >
                  <Link href="/auth/login" onClick={closeNav}>
                    <LogIn className="mr-2 size-4" />
                    Sign In
                  </Link>
                </Button>
                <Button asChild className="h-12 rounded-none">
                  <Link href="/auth/register" onClick={closeNav}>
                    Create Account
                  </Link>
                </Button>
              </div>
            )
          ) : null}
        </SidebarFooter>
      </Sidebar>
    </div>
  )
}
