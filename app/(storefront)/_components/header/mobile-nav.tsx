"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { ArrowRight, Search, ShoppingBag, User, X } from "lucide-react"
import { motion } from "motion/react"
import { Drawer as DrawerPrimitive } from "vaul"

import { routes } from "@/configs/routes"
import { cn } from "@/lib/utils"

import { MobileAccountTab } from "./mobile-account-tab"
import { MobileShopTab } from "./mobile-shop-tab"
import { type HeaderUser } from "./types"

const SEARCH_QUICK_LINKS: { label: string; href: string }[] = [
  { label: "Shop All Products", href: routes.storefront.prodcuts.root },
  { label: "Deals & Offers", href: routes.storefront.deals.root },
  {
    label: "iPhone",
    href: `${routes.storefront.prodcuts.root}?category=iphone`,
  },
  { label: "Mac", href: `${routes.storefront.prodcuts.root}?category=mac` },
  {
    label: "Refurbished",
    href: `${routes.storefront.prodcuts.root}?condition=refurbished`,
  },
]

type MobileNavProps = {
  user?: HeaderUser
  cartCount: number
}

export function MobileNav({ user, cartCount }: MobileNavProps) {
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
            <Search className="size-5" />
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

      {/* Menu drawer */}
      <FullScreenDrawer
        open={menuOpen}
        onOpenChange={setMenuOpen}
        ariaLabel="Navigation"
      >
        <nav
          role="tablist"
          aria-label="Navigation sections"
          className="flex gap-6 border-b border-neutral-200 px-5 py-3"
        >
          <TopTab
            label="Shop"
            icon={<ShoppingBag className="size-4" />}
            selected={tab === "shop"}
            onSelect={() => setTab("shop")}
          />
          <TopTab
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
      </FullScreenDrawer>

      {/* Search drawer */}
      <FullScreenDrawer
        open={searchOpen}
        onOpenChange={setSearchOpen}
        ariaLabel="Search"
      >
        <MobileSearchBody onClose={() => setSearchOpen(false)} />
      </FullScreenDrawer>
    </div>
  )
}

function HamburgerIcon({ open }: { open: boolean }) {
  const bar = "absolute block h-[1.5px] w-[18px] rounded bg-current"
  const transition = { duration: 0.2, ease: [0.04, 0.04, 0.12, 0.96] as const }
  return (
    <span
      aria-hidden="true"
      className="relative inline-flex size-5 items-center justify-center"
    >
      <motion.span
        className={bar}
        animate={{ y: open ? 0 : -3, rotate: open ? 45 : 0 }}
        transition={transition}
      />
      <motion.span
        className={bar}
        animate={{ y: open ? 0 : 3, rotate: open ? -45 : 0 }}
        transition={transition}
      />
    </span>
  )
}

function TopTab({
  label,
  icon,
  selected,
  onSelect,
}: {
  label: string
  icon: React.ReactNode
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      role="tab"
      type="button"
      aria-selected={selected}
      onClick={onSelect}
      className={cn(
        "relative inline-flex items-center gap-1.5 pb-1.5 text-sm font-medium transition-colors",
        selected ? "text-indigo-600" : "text-neutral-500",
      )}
    >
      {icon}
      {label}
      {selected ? (
        <motion.span
          layoutId="mobile-nav-top-indicator"
          className="absolute inset-x-0 -bottom-3 h-0.5 rounded-t bg-indigo-600"
          transition={{ duration: 0.2, ease: [0.4, 0, 0.6, 1] }}
        />
      ) : null}
    </button>
  )
}

function FullScreenDrawer({
  open,
  onOpenChange,
  ariaLabel,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  ariaLabel: string
  children: React.ReactNode
}) {
  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      direction="left"
      shouldScaleBackground={false}
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/10" />
        <DrawerPrimitive.Content
          aria-label={ariaLabel}
          className="fixed inset-y-0 left-0 z-50 flex h-dvh w-full flex-col bg-white outline-none"
        >
          <DrawerPrimitive.Title className="sr-only">
            {ariaLabel}
          </DrawerPrimitive.Title>
          <DrawerPrimitive.Description className="sr-only">
            {ariaLabel}
          </DrawerPrimitive.Description>

          <div className="flex h-14 items-center justify-between border-b border-neutral-200 px-4">
            <span className="text-base font-semibold tracking-tight">
              Evolu<span className="text-indigo-600">X</span>
            </span>
            <DrawerPrimitive.Close
              aria-label="Close"
              className="inline-flex size-10 items-center justify-center text-neutral-700"
            >
              <X className="size-5" />
            </DrawerPrimitive.Close>
          </div>

          {children}
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  )
}

function MobileSearchBody({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [query, setQuery] = React.useState("")

  React.useEffect(() => {
    const id = window.setTimeout(() => inputRef.current?.focus(), 120)
    return () => window.clearTimeout(id)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    router.push(routes.storefront.search({ q: trimmed }))
    onClose()
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-5 pb-12">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-5 py-4"
      >
        <Search className="size-5 text-neutral-500" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products, brands, and more"
          aria-label="Search"
          className="flex-1 bg-transparent text-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
        />
      </form>

      <div className="mt-8">
        <p className="mb-3 text-sm font-medium text-neutral-500">
          Popular searches
        </p>
        <div className="flex flex-wrap gap-2">
          {SEARCH_QUICK_LINKS.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-sm text-neutral-800 hover:border-indigo-300 hover:text-indigo-600"
            >
              <ArrowRight className="size-3.5 text-neutral-400" />
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
