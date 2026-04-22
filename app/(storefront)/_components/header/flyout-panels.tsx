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
  const featured = category.models.filter((m) => m.featured)
  const rest = category.models.filter((m) => !m.featured)
  const cardCount = featured.length

  return (
    <motion.div
      className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-8 pt-6 pb-10"
      variants={listVariants}
      initial="hidden"
      animate="show"
    >
      {cardCount > 0 ? (
        <div className="flex flex-wrap gap-3">
          {featured.map((model) => (
            <motion.div
              key={model.name}
              variants={itemVariants}
              className="w-44 shrink-0"
            >
              <Link
                href={model.href}
                onClick={onNavigate}
                className="block overflow-hidden rounded-lg border border-neutral-200/70 bg-white transition-colors hover:border-neutral-300"
              >
                <div
                  className={cn(
                    "h-38.5 w-full bg-linear-to-br",
                    model.gradient ?? "from-neutral-200 to-neutral-400",
                  )}
                />
                <div className="px-2.5 py-2">
                  <p className="truncate text-xs font-semibold tracking-tight text-neutral-900">
                    {model.name}
                  </p>
                  {model.priceFrom ? (
                    <p className="mt-0.5 text-[11px] font-medium text-indigo-600">
                      {formatPriceFrom(model.priceFrom)}
                    </p>
                  ) : null}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <ColumnLinks
          heading={`Explore ${category.label}`}
          items={[
            {
              label: `Explore All ${category.label}`,
              href: category.exploreAllHref,
              bold: true,
            },
            ...rest.map((m) => ({ label: m.name, href: m.href })),
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
      </div>
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
        className="mb-5 text-sm font-medium text-neutral-500"
      >
        {heading}
      </motion.p>
      <ul className="space-y-3.5">
        {items.map((item) => (
          <motion.li key={item.label + item.href} variants={itemVariants}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "block text-[15px] text-neutral-800 transition-colors hover:text-indigo-600",
                item.bold &&
                  "text-lg font-semibold tracking-tight text-neutral-900",
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
      className="mx-auto w-full max-w-5xl px-8 pt-16 pb-20"
      variants={listVariants}
      initial="hidden"
      animate="show"
    >
      <motion.form
        variants={itemVariants}
        onSubmit={handleSubmit}
        className="flex items-center gap-4 rounded-2xl border border-black/10 bg-white px-6 py-5"
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

      <div className="mt-10">
        <motion.p
          variants={itemVariants}
          className="mb-3 text-sm font-medium text-neutral-500"
        >
          Popular searches
        </motion.p>
        <div className="flex flex-wrap gap-2">
          {SEARCH_QUICK_LINKS.map((link) => (
            <motion.div key={link.href + link.label} variants={itemVariants}>
              <Link
                href={link.href}
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-sm text-neutral-800 hover:border-indigo-300 hover:text-indigo-600"
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
  priceLkr: number
  quantity: number
  gradient: string
}

// Placeholder cart preview — frontend-only. Real cart state still drives the badge.
const PREVIEW_ITEMS: BagPreviewItem[] = [
  {
    id: "preview-iphone-17-pro",
    name: "iPhone 17 Pro",
    variant: "256GB · Titanium",
    priceLkr: 360000,
    quantity: 1,
    gradient: "from-stone-500 to-stone-800",
  },
  {
    id: "preview-airpods-pro-2",
    name: "AirPods Pro 2",
    variant: "USB-C",
    priceLkr: 75000,
    quantity: 1,
    gradient: "from-neutral-300 to-neutral-500",
  },
]

function formatLkr(value: number) {
  return `LKR ${value.toLocaleString("en-US")}`
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
  const subtotalLkr = items.reduce(
    (sum, item) => sum + item.priceLkr * item.quantity,
    0,
  )

  return (
    <motion.div
      className="mx-auto w-full max-w-xl px-8 pt-14 pb-20"
      variants={listVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div
        variants={itemVariants}
        className="mb-5 flex items-center justify-between"
      >
        <div>
          <p className="text-sm font-medium text-neutral-500">Your bag</p>
          <p className="mt-1 text-xl font-semibold tracking-tight text-neutral-900">
            {hasItems
              ? `${cartCount} ${cartCount === 1 ? "item" : "items"}`
              : "Your bag is empty"}
          </p>
        </div>
        <ShoppingBag className="size-6 text-neutral-400" />
      </motion.div>

      {hasItems ? (
        <>
          <ul className="divide-y divide-neutral-200 rounded-2xl border border-black/10 bg-white">
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
                  {formatLkr(item.priceLkr * item.quantity)}
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
              {formatLkr(subtotalLkr)}
            </span>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mt-5 grid grid-cols-2 gap-2"
          >
            <Link
              href={routes.storefront.cart.root}
              onClick={onNavigate}
              className="inline-flex h-11 items-center justify-center rounded-full border border-neutral-300 text-sm font-medium text-neutral-900 hover:border-neutral-400"
            >
              View bag
            </Link>
            <Link
              href={routes.storefront.cart.root}
              onClick={onNavigate}
              className="inline-flex h-11 items-center justify-center rounded-full bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-500"
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
            className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-indigo-600 px-6 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Shop the store
          </Link>
        </motion.div>
      )}

      <motion.div
        variants={itemVariants}
        className="mt-7 border-t border-neutral-200 pt-4 text-xs text-neutral-500"
      >
        <p>Free shipping over LKR 15,000 · 30-day returns · 0% financing</p>
      </motion.div>
    </motion.div>
  )
}
