"use client"

import Link from "next/link"

import { ChevronLeft, ChevronRight, LogIn, LogOut, X } from "lucide-react"

import { type GuestAuthPromptSource } from "@/components/auth/guest-auth-prompt"
import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { routes } from "@/configs/routes"
import {
  type StorefrontNavBrand,
  type StorefrontNavCategory,
  type StorefrontNavigationData,
} from "@/lib/storefront/navigation"

import {
  getCurrentStorefrontPathWithQuery,
  getStorefrontProductsHref,
} from "./header-utils"
import { accountLinks, mobileRootNavLinks } from "./navigation-config"
import { type MobileNavigationView } from "./types"

type MobileNavigationHeaderProps = {
  onClose: () => void
  onViewChange: (view: MobileNavigationView) => void
  view: MobileNavigationView
}

export function MobileNavigationHeader({
  onClose,
  onViewChange,
  view,
}: MobileNavigationHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <Link
          href={routes.storefront.root}
          onClick={onClose}
          className="text-lg font-semibold tracking-tight"
        >
          EvoluX
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="size-9"
        >
          <X className="size-5" />
          <span className="sr-only">Close navigation</span>
        </Button>
      </div>

      <Tabs
        value={view === "menu" ? "menu" : "categories"}
        onValueChange={(value) =>
          onViewChange(value === "menu" ? "menu" : "categories")
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
    </>
  )
}

type MobileMenuViewProps = {
  navigation: StorefrontNavigationData
  onNavigate: () => void
  pathname: string
}

export function MobileMenuView({
  navigation,
  onNavigate,
  pathname,
}: MobileMenuViewProps) {
  return (
    <>
      <SidebarGroup className="px-0 pt-0">
        <SidebarGroupContent>
          <SidebarMenu>
            {mobileRootNavLinks.map((link) => {
              const Icon = link.icon

              return (
                <SidebarMenuItem key={link.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === link.href}
                    className="h-12 rounded-none border-b px-4 text-sm"
                  >
                    <Link href={link.href} onClick={onNavigate}>
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

      <SidebarGroup className="px-0 pb-0">
        <SidebarGroupLabel className="px-4 text-[11px] uppercase tracking-[0.18em] text-sidebar-foreground/60">
          Featured brands
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="space-y-0">
            {navigation.brands.slice(0, 4).map((brand) => (
              <Link
                key={brand.id}
                href={routes.storefront.brands.id(brand.slug)}
                onClick={onNavigate}
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
  )
}

type MobileCategoriesViewProps = {
  categories: StorefrontNavCategory[]
  onSelectCategory: (categorySlug: string) => void
}

export function MobileCategoriesView({
  categories,
  onSelectCategory,
}: MobileCategoriesViewProps) {
  return (
    <SidebarGroup className="px-0 py-0">
      <SidebarGroupContent>
        <div className="space-y-0">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelectCategory(category.slug)}
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
  )
}

type MobileBrandsViewProps = {
  activeCategory?: StorefrontNavCategory
  onBack: () => void
  onNavigate: () => void
  onSelectBrand: (brandId: string) => void
}

export function MobileBrandsView({
  activeCategory,
  onBack,
  onNavigate,
  onSelectBrand,
}: MobileBrandsViewProps) {
  return (
    <SidebarGroup className="px-0 py-0">
      <SidebarGroupContent>
        <div className="border-b">
          <button
            type="button"
            onClick={onBack}
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
                  href={getStorefrontProductsHref({
                    category: activeCategory.slug,
                  })}
                  onClick={onNavigate}
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
                    onClick={() => onSelectBrand(brand.id)}
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
  )
}

type MobileProductsViewProps = {
  activeBrand?: StorefrontNavBrand
  activeCategory?: StorefrontNavCategory
  onBack: () => void
  onNavigate: () => void
}

export function MobileProductsView({
  activeBrand,
  activeCategory,
  onBack,
  onNavigate,
}: MobileProductsViewProps) {
  return (
    <SidebarGroup className="px-0 py-0">
      <SidebarGroupContent>
        <div className="border-b">
          <button
            type="button"
            onClick={onBack}
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
                  onClick={onNavigate}
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
                    onClick={onNavigate}
                    className="flex items-center justify-between border-b px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
                  >
                    <span className="min-w-0 truncate pr-4">{model.name}</span>
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
  )
}

type MobileNavigationFooterProps = {
  isAuthenticated: boolean
  onGuestAuthOpen: (callbackUrl: string, source: GuestAuthPromptSource) => void
  onProtectedNavigate: (href: string) => void
  onSignOut: () => Promise<void>
  userEmail?: string
  userName?: string | null
  view: MobileNavigationView
}

export function MobileNavigationFooter({
  isAuthenticated,
  onGuestAuthOpen,
  onProtectedNavigate,
  onSignOut,
  userEmail,
  userName,
  view,
}: MobileNavigationFooterProps) {
  if (view !== "menu") {
    return null
  }

  return isAuthenticated ? (
    <>
      <div className="border-b px-4 py-4">
        <p className="text-xs text-sidebar-foreground/70">Signed in as</p>
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
              onClick={() => onProtectedNavigate(link.href)}
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
          onClick={onSignOut}
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
    <>
      <div className="space-y-0 border-b">
        {accountLinks.map((link) => {
          const Icon = link.icon

          return (
            <button
              key={link.href}
              type="button"
              onClick={() => onGuestAuthOpen(link.href, link.source)}
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
      </div>

      <div className="grid grid-cols-2 gap-0">
        <Button
          variant="ghost"
          className="h-12 rounded-none border-r"
          onClick={() =>
            onGuestAuthOpen(getCurrentStorefrontPathWithQuery(), "signin")
          }
        >
          <LogIn className="mr-2 size-4" />
          Sign In
        </Button>
        <Button
          className="h-12 rounded-none"
          onClick={() =>
            onGuestAuthOpen(getCurrentStorefrontPathWithQuery(), "register")
          }
        >
          Create Account
        </Button>
      </div>
    </>
  )
}
