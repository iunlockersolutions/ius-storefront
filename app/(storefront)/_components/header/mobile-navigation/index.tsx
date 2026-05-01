"use client"

import * as React from "react"
import Link from "next/link"

import { Search as SearchIcon, ShoppingBag, User } from "lucide-react"

import { routes } from "@/configs/routes"

import { Search } from "../search"
import { type HeaderUser } from "../types"
import { MobileAccountTab } from "./mobile-account-tab"
import { HamburgerIcon } from "./mobile-nav-hamburger-icon"
import { MobileNavSideSheet } from "./mobile-nav-side-sheet"
import { MobileNavTopTab } from "./mobile-nav-top-tab"
import { MobileShopTab } from "./mobile-shop-tab"

type MobileNavigationProps = {
  user?: HeaderUser
  cartCount: number
}

export function MobileNavigation({ user, cartCount }: MobileNavigationProps) {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [tab, setTab] = React.useState<"shop" | "account">("shop")

  return (
    <div className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-nav w-full items-center justify-between px-4">
        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className="inline-flex size-10 items-center justify-center text-neutral-800"
        >
          <HamburgerIcon open={menuOpen} />
        </button>

        <Link
          href="/"
          className="flex items-center text-base font-semibold tracking-tight"
          aria-label="Home"
        >
          Evolu<span className="text-indigo-600">X</span>
        </Link>

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
            className="inline-flex size-10 items-center justify-center text-neutral-800"
          >
            <SearchIcon className="size-5" />
          </button>

          <Link
            href={routes.storefront.cart.root}
            aria-label={`Bag (${cartCount} items)`}
            className="relative inline-flex size-10 items-center justify-center text-neutral-800"
          >
            <ShoppingBag className="size-5" />
            {cartCount > 0 ? (
              <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[9px] font-medium text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
          </Link>
        </div>
      </div>

      <MobileNavSideSheet
        open={menuOpen}
        onOpenChange={setMenuOpen}
        ariaLabel="Navigation"
      >
        <nav
          role="tablist"
          aria-label="Navigation sections"
          className="flex gap-6 border-b border-neutral-200 px-5 py-3"
        >
          <MobileNavTopTab
            label="Shop"
            icon={<ShoppingBag className="size-4" />}
            selected={tab === "shop"}
            onSelect={() => setTab("shop")}
          />
          <MobileNavTopTab
            label="Account"
            icon={<User className="size-4" />}
            selected={tab === "account"}
            onSelect={() => setTab("account")}
          />
        </nav>

        <div className="flex flex-1 flex-col overflow-hidden">
          {tab === "shop" ? (
            <MobileShopTab onClose={() => setMenuOpen(false)} />
          ) : (
            <MobileAccountTab user={user} onClose={() => setMenuOpen(false)} />
          )}
        </div>
      </MobileNavSideSheet>

      <MobileNavSideSheet
        open={searchOpen}
        onOpenChange={setSearchOpen}
        ariaLabel="Search"
      >
        <Search onClose={() => setSearchOpen(false)} variant="mobile" />
      </MobileNavSideSheet>
    </div>
  )
}
