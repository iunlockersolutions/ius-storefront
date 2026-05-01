"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { ArrowRight, Search } from "lucide-react"
import { m } from "motion/react"

import { routes } from "@/configs/routes"
import { cn } from "@/lib/utils"

import { formatPriceFrom, searchQuickLinks } from "./catalog"
import { CatalogCategory } from "./type"

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
  category: CatalogCategory
  onNavigate: () => void
}) {
  const featured = category.models.filter((m) => m.featured)
  const rest = category.models.filter((m) => !m.featured)
  const cardCount = featured.length

  return (
    <m.div
      className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-8 pt-6 pb-10"
      variants={listVariants}
      initial="hidden"
      animate="show"
    >

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
    </m.div>
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
      <m.p
        variants={itemVariants}
        className="mb-5 text-sm font-medium text-neutral-500"
      >
        {heading}
      </m.p>
      <ul className="space-y-3.5">
        {items.map((item) => (
          <m.li key={item.label + item.href} variants={itemVariants}>
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
          </m.li>
        ))}
      </ul>
    </div>
  )
}

export function SearchPanel({
  onClose,
  variant,
}: {
  onClose: () => void
  variant: "desktop" | "mobile"
}) {
  const router = useRouter()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [query, setQuery] = React.useState("")

  React.useEffect(() => {
    const id = window.setTimeout(
      () => inputRef.current?.focus(),
      variant === "desktop" ? 80 : 120,
    )
    return () => window.clearTimeout(id)
  }, [variant])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    router.push(routes.storefront.search({ q: trimmed }))
    onClose()
  }

  const content = (
    <>
      <m.form
        variants={variant === "desktop" ? itemVariants : undefined}
        onSubmit={handleSubmit}
        className={cn(
          "flex items-center rounded-2xl border border-black/10 bg-white",
          variant === "desktop" ? "gap-4 px-6 py-5" : "gap-3 px-5 py-4",
        )}
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
        {variant === "desktop" && query.trim() ? (
          <button
            type="submit"
            aria-label="Submit search"
            className="text-indigo-600 hover:text-indigo-500"
          >
            <ArrowRight className="size-5" />
          </button>
        ) : null}
      </m.form>

      <div className={variant === "desktop" ? "mt-10" : "mt-8"}>
        <m.p
          variants={variant === "desktop" ? itemVariants : undefined}
          className="mb-3 text-sm font-medium text-neutral-500"
        >
          Popular searches
        </m.p>
        <div className="flex flex-wrap gap-2">
          {searchQuickLinks.map((link) =>
            variant === "desktop" ? (
              <m.div key={link.id} variants={itemVariants}>
                <Link
                  href={link.href}
                  onClick={onClose}
                  className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-sm text-neutral-800 hover:border-indigo-300 hover:text-indigo-600"
                >
                  {link.label}
                </Link>
              </m.div>
            ) : (
              <Link
                key={link.id}
                href={link.href}
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-sm text-neutral-800 hover:border-indigo-300 hover:text-indigo-600"
              >
                <ArrowRight className="size-3.5 text-neutral-400" />
                {link.label}
              </Link>
            ),
          )}
        </div>
      </div>
    </>
  )

  if (variant === "mobile") {
    return (
      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-12">{content}</div>
    )
  }

  return (
    <m.div
      className="mx-auto w-full max-w-5xl px-8 pt-16 pb-20"
      variants={listVariants}
      initial="hidden"
      animate="show"
    >
      {content}
    </m.div>
  )
}
