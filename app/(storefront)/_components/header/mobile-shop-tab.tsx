"use client"

import * as React from "react"
import Link from "next/link"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { cn } from "@/lib/utils"

import { appleCatalog, formatPriceFrom, getAppleCategoryById } from "./catalog"
import { APPLE_EASE_MOBILE } from "./nav-context"

const SLIDE_DURATION = 0.35

function categorySubtitle(models: { name: string }[]): string {
  if (models.length === 0) return ""
  const visible = models.slice(0, 3).map((m) => m.name)
  const hasMore = models.length > 3
  return hasMore ? `${visible.join(", ")} & more` : visible.join(", ")
}

export function MobileShopTab({ onClose }: { onClose: () => void }) {
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const activeCategory = activeId ? getAppleCategoryById(activeId) : undefined

  return (
    <div className="relative flex-1 overflow-hidden">
      {/* Root level — denser rows with subtitles */}
      <motion.div
        className="absolute inset-0 overflow-y-auto bg-white"
        animate={{ x: activeId ? "-100%" : "0%" }}
        transition={{ duration: SLIDE_DURATION, ease: APPLE_EASE_MOBILE }}
      >
        <ul className="divide-y divide-neutral-100">
          {appleCatalog.map((category) => (
            <li key={category.id}>
              <button
                type="button"
                onClick={() => setActiveId(category.id)}
                className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors active:bg-neutral-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[20px] font-semibold tracking-tight text-neutral-900">
                    {category.label}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-neutral-500">
                    {categorySubtitle(category.models)}
                  </p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-neutral-400" />
              </button>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Detail level */}
      <AnimatePresence>
        {activeCategory ? (
          <motion.div
            key={activeCategory.id}
            initial={{ x: "100%" }}
            animate={{ x: "0%" }}
            exit={{ x: "100%" }}
            transition={{ duration: SLIDE_DURATION, ease: APPLE_EASE_MOBILE }}
            className="absolute inset-0 overflow-y-auto bg-white"
          >
            <div className="flex items-center gap-2 border-b border-neutral-100 px-3 py-2">
              <button
                type="button"
                aria-label="Back"
                onClick={() => setActiveId(null)}
                className="inline-flex size-10 items-center justify-center text-neutral-700"
              >
                <ChevronLeft className="size-5" />
              </button>
              <p className="text-sm font-medium text-neutral-900">
                {activeCategory.label}
              </p>
            </div>

            <div className="px-5 py-4">
              <Link
                href={activeCategory.exploreAllHref}
                onClick={onClose}
                className="block text-[22px] font-semibold tracking-tight text-neutral-900"
              >
                Explore All {activeCategory.label}
              </Link>

              <ul className="mt-1 divide-y divide-neutral-100">
                {activeCategory.models.map((model) => (
                  <li key={model.name}>
                    <Link
                      href={model.href}
                      onClick={onClose}
                      className="flex items-center gap-3 py-3"
                    >
                      <div
                        className={cn(
                          "size-12 shrink-0 rounded-lg bg-linear-to-br",
                          model.gradient ?? "from-neutral-200 to-neutral-400",
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-semibold tracking-tight text-neutral-900">
                          {model.name}
                        </p>
                        {model.priceFrom ? (
                          <p className="mt-0.5 text-xs font-medium text-indigo-600">
                            {formatPriceFrom(model.priceFrom)}
                          </p>
                        ) : model.tagline ? (
                          <p className="mt-0.5 truncate text-xs text-neutral-500">
                            {model.tagline}
                          </p>
                        ) : null}
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-neutral-300" />
                    </Link>
                  </li>
                ))}
              </ul>

              {activeCategory.shopLinks.length > 0 ? (
                <LinkSection
                  heading={`Shop ${activeCategory.label}`}
                  items={activeCategory.shopLinks}
                  onClose={onClose}
                />
              ) : null}

              {activeCategory.moreLinks.length > 0 ? (
                <LinkSection
                  heading={`More from ${activeCategory.label}`}
                  items={activeCategory.moreLinks}
                  onClose={onClose}
                />
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function LinkSection({
  heading,
  items,
  onClose,
}: {
  heading: string
  items: { label: string; href: string }[]
  onClose: () => void
}) {
  return (
    <div className="mt-6">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
        {heading}
      </p>
      <ul className="divide-y divide-neutral-100">
        {items.map((link) => (
          <li key={link.href + link.label}>
            <Link
              href={link.href}
              onClick={onClose}
              className="block py-2.5 text-[15px] text-neutral-800"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
