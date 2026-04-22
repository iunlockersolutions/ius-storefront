"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { ArrowRight, Search } from "lucide-react"
import { motion } from "motion/react"

import { routes } from "@/configs/routes"

import { type AppleCatalogCategory } from "./catalog"

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
  return (
    <motion.div
      className="mx-auto grid w-full max-w-5xl grid-cols-3 gap-10 px-6 pt-12 pb-16"
      variants={listVariants}
      initial="hidden"
      animate="show"
    >
      <div>
        <motion.p
          variants={itemVariants}
          className="mb-5 text-xs text-neutral-500"
        >
          Explore {category.label}
        </motion.p>
        <ul className="space-y-3">
          <motion.li variants={itemVariants}>
            <Link
              href={category.exploreAllHref}
              onClick={onNavigate}
              className="block text-2xl font-semibold tracking-tight text-neutral-900 hover:text-neutral-700"
            >
              Explore All {category.label}
            </Link>
          </motion.li>
          {category.models.map((model) => (
            <motion.li key={model.name} variants={itemVariants}>
              <Link
                href={model.href}
                onClick={onNavigate}
                className="block text-2xl font-semibold tracking-tight text-neutral-900 hover:text-neutral-700"
              >
                {model.name}
              </Link>
            </motion.li>
          ))}
        </ul>
      </div>

      {category.shopLinks.length > 0 ? (
        <div>
          <motion.p
            variants={itemVariants}
            className="mb-5 text-xs text-neutral-500"
          >
            Shop {category.label}
          </motion.p>
          <ul className="space-y-3">
            {category.shopLinks.map((link) => (
              <motion.li key={link.label + link.href} variants={itemVariants}>
                <Link
                  href={link.href}
                  onClick={onNavigate}
                  className="block text-sm text-neutral-800 hover:text-neutral-600"
                >
                  {link.label}
                </Link>
              </motion.li>
            ))}
          </ul>
        </div>
      ) : (
        <div />
      )}

      {category.moreLinks.length > 0 ? (
        <div>
          <motion.p
            variants={itemVariants}
            className="mb-5 text-xs text-neutral-500"
          >
            More from {category.label}
          </motion.p>
          <ul className="space-y-3">
            {category.moreLinks.map((link) => (
              <motion.li key={link.label + link.href} variants={itemVariants}>
                <Link
                  href={link.href}
                  onClick={onNavigate}
                  className="block text-sm text-neutral-800 hover:text-neutral-600"
                >
                  {link.label}
                </Link>
              </motion.li>
            ))}
          </ul>
        </div>
      ) : (
        <div />
      )}
    </motion.div>
  )
}

const SEARCH_QUICK_LINKS: { label: string; href: string }[] = [
  { label: "Shop All Products", href: routes.storefront.prodcuts.root },
  { label: "Deals", href: routes.storefront.deals.root },
  {
    label: "iPhone",
    href: `${routes.storefront.prodcuts.root}?category=iphone`,
  },
  { label: "Mac", href: `${routes.storefront.prodcuts.root}?category=mac` },
  { label: "iPad", href: `${routes.storefront.prodcuts.root}?category=ipad` },
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
      className="mx-auto w-full max-w-5xl px-6 pt-12 pb-16"
      variants={listVariants}
      initial="hidden"
      animate="show"
    >
      <motion.form
        variants={itemVariants}
        onSubmit={handleSubmit}
        className="flex items-center gap-3"
      >
        <Search className="size-6 text-neutral-500" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          aria-label="Search"
          className="flex-1 bg-transparent text-2xl tracking-tight text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
        />
        {query.trim() ? (
          <button
            type="submit"
            aria-label="Submit search"
            className="text-neutral-500 hover:text-neutral-900"
          >
            <ArrowRight className="size-5" />
          </button>
        ) : null}
      </motion.form>

      <div className="mt-10">
        <motion.p
          variants={itemVariants}
          className="mb-4 text-xs text-neutral-500"
        >
          Quick Links
        </motion.p>
        <ul className="space-y-3">
          {SEARCH_QUICK_LINKS.map((link) => (
            <motion.li key={link.href + link.label} variants={itemVariants}>
              <Link
                href={link.href}
                onClick={onClose}
                className="inline-flex items-center gap-3 text-sm font-medium text-neutral-900 hover:text-neutral-700"
              >
                <ArrowRight className="size-4 text-neutral-500" />
                {link.label}
              </Link>
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.div>
  )
}

const BAG_LINKS: { label: string; href: string }[] = [
  { label: "Orders", href: routes.storefront.orders.root },
  { label: "Favorites", href: routes.storefront.favorites.root },
  { label: "Profile", href: routes.storefront.profile.root },
]

export function BagFlyout({ onNavigate }: { onNavigate: () => void }) {
  return (
    <motion.div
      className="mx-auto w-full max-w-xl px-6 pt-12 pb-16"
      variants={listVariants}
      initial="hidden"
      animate="show"
    >
      <motion.p
        variants={itemVariants}
        className="mb-6 text-base text-neutral-800"
      >
        Your bag is ready when you are.
      </motion.p>

      <motion.div variants={itemVariants}>
        <Link
          href={routes.storefront.cart.root}
          onClick={onNavigate}
          className="inline-flex text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          Review your bag
        </Link>
      </motion.div>

      <div className="mt-10 border-t pt-6">
        <motion.p
          variants={itemVariants}
          className="mb-4 text-xs text-neutral-500"
        >
          My Account
        </motion.p>
        <ul className="space-y-3">
          {BAG_LINKS.map((link) => (
            <motion.li key={link.href} variants={itemVariants}>
              <Link
                href={link.href}
                onClick={onNavigate}
                className="block text-sm text-neutral-800 hover:text-neutral-600"
              >
                {link.label}
              </Link>
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.div>
  )
}
