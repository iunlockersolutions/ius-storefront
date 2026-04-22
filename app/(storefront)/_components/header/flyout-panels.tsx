"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { ArrowRight, Minus, Plus, Search, ShoppingBag } from "lucide-react"
import { motion } from "motion/react"

import { routes } from "@/configs/routes"
import { cn } from "@/lib/utils"

import { type AppleCatalogCategory, formatPriceFrom } from "./catalog"

const listVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.025, delayChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: -6 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.4, 0, 0.6, 1] as const },
  },
}

export function ProductFlyout({
  category,
  onNavigate,
}: {
  category: AppleCatalogCategory
  onNavigate: () => void
}) {
  const featured = category.models.slice(0, 3)
  const remainingModels = category.models.slice(3)

  return (
    <motion.div
      className="mx-auto grid w-full max-w-7xl grid-cols-[1.4fr_1fr_1fr_1fr] gap-8 px-6 pt-10 pb-14"
      variants={listVariants}
      initial="hidden"
      animate="show"
    >
      <div>
        <motion.p
          variants={itemVariants}
          className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-600"
        >
          Featured
        </motion.p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {featured.map((model) => (
            <motion.div key={model.name} variants={itemVariants}>
              <Link
                href={model.href}
                onClick={onNavigate}
                className="group block overflow-hidden rounded-xl border border-neutral-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div
                  className={cn(
                    "aspect-[4/3] w-full bg-linear-to-br",
                    model.gradient ?? "from-neutral-200 to-neutral-400",
                  )}
                />
                <div className="px-3 py-2.5">
                  <p className="text-sm font-semibold tracking-tight text-neutral-900">
                    {model.name}
                  </p>
                  {model.priceFrom ? (
                    <p className="mt-0.5 text-xs font-medium text-indigo-600">
                      {formatPriceFrom(model.priceFrom)}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-xs text-neutral-500 line-clamp-1">
                      {model.tagline}
                    </p>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      <ColumnLinks
        heading={`Explore ${category.label}`}
        items={[
          {
            label: `Explore All ${category.label}`,
            href: category.exploreAllHref,
            bold: true,
          },
          ...remainingModels.map((m) => ({ label: m.name, href: m.href })),
        ]}
        onNavigate={onNavigate}
      />

      <ColumnLinks
        heading={`Shop ${category.label}`}
        items={category.shopLinks}
        onNavigate={onNavigate}
      />

      <ColumnLinks
        heading={`More from ${category.label}`}
        items={category.moreLinks}
        onNavigate={onNavigate}
      />
    </motion.div>
  )
}

function ColumnLinks({
  heading,
  items,
  onNavigate,
}: {
  heading: string
  items: { label: string; href: string; bold?: boolean }[]
  onNavigate: () => void
}) {
  if (items.length === 0) return <div />
  return (
    <div>
      <motion.p
        variants={itemVariants}
        className="mb-4 border-b border-neutral-200 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500"
      >
        {heading}
      </motion.p>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <motion.li key={item.label + item.href} variants={itemVariants}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "block text-sm text-neutral-800 hover:text-indigo-600",
                item.bold && "font-semibold text-neutral-900",
              )}
            >
              {item.label}
            </Link>
          </motion.li>
        ))}
      </ul>
    </div>
  )
}

const SEARCH_QUICK_LINKS: { label: string; href: string }[] = [
  { label: "Shop All Products", href: routes.storefront.prodcuts.root },
  { label: "Deals & Offers", href: routes.storefront.deals.root },
  {
    label: "iPhone",
    href: `${routes.storefront.prodcuts.root}?category=iphone`,
  },
  { label: "Mac", href: `${routes.storefront.prodcuts.root}?category=mac` },
  { label: "iPad", href: `${routes.storefront.prodcuts.root}?category=ipad` },
  {
    label: "Refurbished",
    href: `${routes.storefront.prodcuts.root}?condition=refurbished`,
  },
]

export function SearchFlyout({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [query, setQuery] = React.useState("")

  React.useEffect(() => {
    const id = window.setTimeout(() => inputRef.current?.focus(), 80)
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
    <motion.div
      className="mx-auto w-full max-w-5xl px-6 pt-10 pb-14"
      variants={listVariants}
      initial="hidden"
      animate="show"
    >
      <motion.form
        variants={itemVariants}
        onSubmit={handleSubmit}
        className="flex items-center gap-3 rounded-full border border-neutral-200 bg-white px-5 py-3 shadow-sm"
      >
        <Search className="size-5 text-neutral-500" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products, brands, and more"
          aria-label="Search"
          className="flex-1 bg-transparent text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
        />
        {query.trim() ? (
          <button
            type="submit"
            aria-label="Submit search"
            className="text-indigo-600 hover:text-indigo-500"
          >
            <ArrowRight className="size-5" />
          </button>
        ) : null}
      </motion.form>

      <div className="mt-8">
        <motion.p
          variants={itemVariants}
          className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500"
        >
          Popular searches
        </motion.p>
        <div className="flex flex-wrap gap-2">
          {SEARCH_QUICK_LINKS.map((link) => (
            <motion.div key={link.href + link.label} variants={itemVariants}>
              <Link
                href={link.href}
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-sm text-neutral-800 hover:border-indigo-300 hover:text-indigo-600"
              >
                {link.label}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

type BagPreviewItem = {
  id: string
  name: string
  variant: string
  priceCents: number
  quantity: number
  gradient: string
}

// Placeholder cart preview — frontend-only. Real cart state still drives the badge.
const PREVIEW_ITEMS: BagPreviewItem[] = [
  {
    id: "preview-iphone-17-pro",
    name: "iPhone 17 Pro",
    variant: "256GB · Titanium",
    priceCents: 1199_00,
    quantity: 1,
    gradient: "from-stone-500 to-stone-800",
  },
  {
    id: "preview-airpods-pro-2",
    name: "AirPods Pro 2",
    variant: "USB-C",
    priceCents: 249_00,
    quantity: 1,
    gradient: "from-neutral-300 to-neutral-500",
  },
]

function formatDollars(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function BagFlyout({
  cartCount,
  onNavigate,
}: {
  cartCount: number
  onNavigate: () => void
}) {
  const hasItems = cartCount > 0
  const items = hasItems ? PREVIEW_ITEMS.slice(0, Math.min(cartCount, 3)) : []
  const subtotalCents = items.reduce(
    (sum, item) => sum + item.priceCents * item.quantity,
    0,
  )

  return (
    <motion.div
      className="mx-auto w-full max-w-xl px-6 pt-10 pb-14"
      variants={listVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div
        variants={itemVariants}
        className="mb-4 flex items-center justify-between"
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-600">
            Your bag
          </p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-neutral-900">
            {hasItems
              ? `${cartCount} ${cartCount === 1 ? "item" : "items"}`
              : "Your bag is empty"}
          </p>
        </div>
        <ShoppingBag className="size-6 text-neutral-400" />
      </motion.div>

      {hasItems ? (
        <>
          <ul className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
            {items.map((item) => (
              <motion.li
                key={item.id}
                variants={itemVariants}
                className="flex items-center gap-3 p-3"
              >
                <div
                  className={cn(
                    "size-14 shrink-0 rounded-lg bg-linear-to-br",
                    item.gradient,
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-900">
                    {item.name}
                  </p>
                  <p className="truncate text-xs text-neutral-500">
                    {item.variant}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-neutral-500">
                    <span className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-1.5 py-0.5">
                      <Minus className="size-3" />
                      <span className="min-w-3 text-center">
                        {item.quantity}
                      </span>
                      <Plus className="size-3" />
                    </span>
                  </div>
                </div>
                <p className="shrink-0 text-sm font-semibold text-neutral-900">
                  {formatDollars(item.priceCents * item.quantity)}
                </p>
              </motion.li>
            ))}
          </ul>

          <motion.div
            variants={itemVariants}
            className="mt-4 flex items-center justify-between text-sm"
          >
            <span className="text-neutral-600">Subtotal</span>
            <span className="font-semibold text-neutral-900">
              {formatDollars(subtotalCents)}
            </span>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mt-5 grid grid-cols-2 gap-2"
          >
            <Link
              href={routes.storefront.cart.root}
              onClick={onNavigate}
              className="inline-flex h-10 items-center justify-center rounded-full border border-neutral-300 text-sm font-medium text-neutral-900 hover:border-neutral-400"
            >
              View bag
            </Link>
            <Link
              href={routes.storefront.cart.root}
              onClick={onNavigate}
              className="inline-flex h-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Checkout
            </Link>
          </motion.div>
        </>
      ) : (
        <motion.div variants={itemVariants} className="mt-2">
          <p className="text-sm text-neutral-600">
            Looks like there&apos;s nothing here yet. Discover something you
            love.
          </p>
          <Link
            href={routes.storefront.prodcuts.root}
            onClick={onNavigate}
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-indigo-600 px-5 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Shop the store
          </Link>
        </motion.div>
      )}

      <motion.div
        variants={itemVariants}
        className="mt-6 border-t border-neutral-200 pt-4 text-xs text-neutral-500"
      >
        <p>Free shipping over $50 · 30-day returns · 0% financing</p>
      </motion.div>
    </motion.div>
  )
}
