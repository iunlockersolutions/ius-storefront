"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { ChevronRight, Dot } from "lucide-react"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { type StorefrontNavigationData } from "@/lib/storefront/navigation"
import { cn } from "@/lib/utils"

import { getStorefrontProductsHref } from "./header-utils"
import { desktopTopLevelLinks } from "./navigation-config"
import { useStorefrontProductNavigation } from "./use-storefront-product-navigation"

interface StorefrontDesktopNavigationProps {
  navigation: StorefrontNavigationData
}

export function DesktopNavigation({
  navigation,
}: StorefrontDesktopNavigationProps) {
  const pathname = usePathname()
  const { activeBrand, activeCategory, selectBrand, selectCategory } =
    useStorefrontProductNavigation(navigation)

  return (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
      <NavigationMenu viewport={false} className="justify-start">
        <NavigationMenuList className="gap-1">
          <NavigationMenuItem>
            <NavigationMenuTrigger className="h-9 rounded-md px-3">
              Products
            </NavigationMenuTrigger>
            <NavigationMenuContent className="left-0 top-full mt-3">
              <div className="w-260 overflow-hidden rounded-xl border bg-background shadow-lg">
                <div className="grid grid-cols-[260px_240px_minmax(0,1fr)]">
                  <div className="border-r bg-muted/20">
                    <div className="border-b px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        Categories
                      </p>
                    </div>

                    <div className="max-h-115 overflow-y-auto">
                      {navigation.productCategories.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onMouseEnter={() => selectCategory(category.slug)}
                          onFocus={() => selectCategory(category.slug)}
                          className={cn(
                            "flex w-full items-center justify-between border-b px-4 py-3.5 text-left text-sm transition-colors",
                            activeCategory?.slug === category.slug
                              ? "bg-background text-foreground"
                              : "text-muted-foreground hover:bg-background hover:text-foreground",
                          )}
                        >
                          <div className="min-w-0 pr-4">
                            <span className="block truncate font-medium">
                              {category.name}
                            </span>
                            <span className="mt-1 block truncate text-xs text-muted-foreground">
                              {category.productCount} products
                            </span>
                          </div>
                          <ChevronRight className="size-4 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeCategory ? (
                    <>
                      <div className="border-r">
                        <div className="border-b px-5 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">
                                {activeCategory.name}
                              </p>
                              <p className="mt-1 truncate text-xs text-muted-foreground">
                                {activeCategory.description ||
                                  `${activeCategory.productCount} products ready to browse.`}
                              </p>
                            </div>
                            <Link
                              href={getStorefrontProductsHref({
                                category: activeCategory.slug,
                              })}
                              className="shrink-0 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                            >
                              View all
                            </Link>
                          </div>
                        </div>

                        <div className="px-5 py-4">
                          <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                            Brands
                          </p>
                          {activeCategory.brands.length > 0 ? (
                            <div className="space-y-1">
                              {activeCategory.brands.map((brand) => (
                                <button
                                  key={brand.id}
                                  type="button"
                                  onMouseEnter={() => selectBrand(brand.id)}
                                  onFocus={() => selectBrand(brand.id)}
                                  className={cn(
                                    "flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm transition-colors",
                                    activeBrand?.id === brand.id
                                      ? "bg-muted text-foreground"
                                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                                  )}
                                >
                                  <span className="min-w-0 truncate pr-4 font-medium">
                                    {brand.name}
                                  </span>
                                  <ChevronRight className="size-4 shrink-0" />
                                </button>
                              ))}
                            </div>
                          ) : (
                            <p className="py-2 text-sm text-muted-foreground">
                              No brands available.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="min-h-115 px-6 py-5">
                        <div className="mb-4 flex items-center justify-between gap-4 border-b pb-4">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                              Products
                            </p>
                            <p className="mt-2 truncate text-base font-semibold">
                              {activeBrand?.name || "Featured products"}
                            </p>
                          </div>
                          {activeBrand ? (
                            <Link
                              href={activeBrand.href}
                              className="shrink-0 text-sm font-medium text-foreground transition-colors hover:text-muted-foreground"
                            >
                              View brand
                            </Link>
                          ) : null}
                        </div>

                        {activeBrand?.models.length ? (
                          <div className="grid grid-cols-2 gap-x-10 gap-y-4">
                            {activeBrand.models.map((model) => (
                              <Link
                                key={model.id}
                                href={model.href}
                                className="group flex items-start gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                              >
                                <Dot className="mt-0.5 size-4 shrink-0 text-border transition-colors group-hover:text-foreground" />
                                <span className="min-w-0 truncate">
                                  {model.name}
                                </span>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <p className="py-2 text-sm text-muted-foreground">
                            No products available.
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2 flex min-h-115 items-center justify-center text-sm text-muted-foreground">
                      No active categories available.
                    </div>
                  )}
                </div>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <div className="flex items-center gap-1">
        {desktopTopLevelLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "inline-flex h-9 items-center px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
              pathname === link.href && "text-foreground",
            )}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
