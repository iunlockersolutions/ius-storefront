"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { ArrowRight, Search, ShoppingBag, X } from "lucide-react"
import { motion } from "motion/react"
import { Drawer as DrawerPrimitive } from "vaul"

import { routes } from "@/configs/routes"
import { cn } from "@/lib/utils"

import { MobileAccountTab } from "./mobile-account-tab"
import { MobileShopTab } from "./mobile-shop-tab"
import { type HeaderUser } from "./types"

const SEARCH_QUICK_LINKS: { label: string; href: string }[] = [
  { label: "Shop All Products", href: routes.storefront.prodcuts.root },
  { label: "Deals", href: routes.storefront.deals.root },
  {
    label: "iPhone",
    href: `${routes.storefront.prodcuts.root}?category=iphone`,
  },
  { label: "Mac", href: `${routes.storefront.prodcuts.root}?category=mac` },
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
    <div className="sticky top-0 z-40 border-b border-black/5 bg-[rgb(250,250,252)]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-12 w-full items-center justify-between px-4">
        <Link href="/" className="flex items-center" aria-label="Home">
          <span className="text-base font-semibold tracking-tight">
            Evolu<span className="text-indigo-600">X</span>
          </span>
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

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex size-10 items-center justify-center text-neutral-800"
          >
            <HamburgerIcon open={menuOpen} />
          </button>
        </div>
      </div>

      <FullScreenDrawer
        open={menuOpen}
        onOpenChange={setMenuOpen}
        ariaLabel="Navigation"
        header={
          <div
            role="tablist"
            aria-label="Navigation sections"
            className="flex gap-6"
          >
            <TabTrigger
              label="Shop"
              selected={tab === "shop"}
              onSelect={() => setTab("shop")}
            />
            <TabTrigger
              label="Account"
              selected={tab === "account"}
              onSelect={() => setTab("account")}
            />
          </div>
        }
      >
        {tab === "shop" ? (
          <MobileShopTab onClose={() => setMenuOpen(false)} />
        ) : (
          <MobileAccountTab user={user} onClose={() => setMenuOpen(false)} />
        )}
      </FullScreenDrawer>

      <FullScreenDrawer
        open={searchOpen}
        onOpenChange={setSearchOpen}
        ariaLabel="Search"
        header={<span className="text-sm font-medium">Search</span>}
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

function TabTrigger({
  label,
  selected,
  onSelect,
}: {
  label: string
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
        "relative pb-1 text-sm font-medium transition-colors",
        selected
          ? "text-neutral-900"
          : "text-neutral-500 hover:text-neutral-800",
      )}
    >
      {label}
      {selected ? (
        <motion.span
          layoutId="mobile-nav-tab-underline"
          className="absolute -bottom-px left-0 right-0 h-0.5 bg-neutral-900"
        />
      ) : null}
    </button>
  )
}

function FullScreenDrawer({
  open,
  onOpenChange,
  ariaLabel,
  header,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  ariaLabel: string
  header: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      direction="top"
      shouldScaleBackground={false}
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/10" />
        <DrawerPrimitive.Content
          aria-label={ariaLabel}
          className="fixed inset-x-0 top-0 z-50 flex h-dvh flex-col bg-background outline-none"
        >
          <DrawerPrimitive.Title className="sr-only">
            {ariaLabel}
          </DrawerPrimitive.Title>
          <DrawerPrimitive.Description className="sr-only">
            {ariaLabel}
          </DrawerPrimitive.Description>

          <div className="flex items-center justify-between border-b px-4 py-3">
            {header}
            <DrawerPrimitive.Close
              aria-label="Close"
              className="inline-flex size-10 items-center justify-center text-neutral-700"
            >
              <X className="size-5" />
            </DrawerPrimitive.Close>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
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
    <div className="flex-1 overflow-y-auto px-6 pt-6 pb-12">
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <Search className="size-6 text-neutral-500" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          aria-label="Search"
          className="flex-1 bg-transparent text-2xl font-semibold tracking-tight text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
        />
      </form>

      <div className="mt-8">
        <p className="mb-3 text-xs text-neutral-500">Quick Links</p>
        <ul className="space-y-3">
          {SEARCH_QUICK_LINKS.map((link) => (
            <li key={link.href + link.label}>
              <Link
                href={link.href}
                onClick={onClose}
                className="inline-flex items-center gap-3 text-base font-medium text-neutral-900 hover:text-neutral-700"
              >
                <ArrowRight className="size-4 text-neutral-500" />
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
