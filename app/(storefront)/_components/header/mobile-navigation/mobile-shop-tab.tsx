"use client"

import * as React from "react"
import Link from "next/link"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { AnimatePresence, m } from "motion/react"

import { appleCatalog, getAppleCategoryById } from "../catalog"

const SLIDE_DURATION = 0.35
const APPLE_EASE_MOBILE = [0.52, 0.16, 0.24, 1] as const

export function MobileShopTab({ onClose }: { onClose: () => void }) {
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const activeCategory = activeId ? getAppleCategoryById(activeId) : undefined

  return (
    <div className="relative flex-1 overflow-hidden">
      <m.div
        className="absolute inset-0 overflow-y-auto bg-white"
        animate={{ x: activeId ? "-100%" : "0%" }}
        transition={{ duration: SLIDE_DURATION, ease: APPLE_EASE_MOBILE }}
      >
        <ul className="px-6 py-6 space-y-2">
          {appleCatalog.map((category) => (
            <li key={category.id}>
              <button
                type="button"
                onClick={() => setActiveId(category.id)}
                className="flex w-full items-center justify-between gap-3 rounded-lg py-2.5 text-left transition-colors active:bg-neutral-50"
              >
                <div className="min-w-0 flex-1">
                  <h1 className="text-4xl font-semibold tracking-tight text-neutral-900">
                    {category.label}
                  </h1>
                </div>
                <ChevronRight className="size-5 shrink-0 text-neutral-400" />
              </button>
            </li>
          ))}
        </ul>
      </m.div>

      {/* Detail level */}
      <AnimatePresence>
        {activeCategory ? (
          <m.div
            key={activeCategory.id}
            initial={{ x: "100%" }}
            animate={{ x: "0%" }}
            exit={{ x: "100%" }}
            transition={{ duration: SLIDE_DURATION, ease: APPLE_EASE_MOBILE }}
            className="absolute inset-0 overflow-y-auto bg-white"
          >
            <div className="flex items-center gap-2 px-3 py-2">
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

              <ul className="mt-3 space-y-2">
                {activeCategory.models.map((model) => (
                  <li key={model.name}>
                    <Link
                      href={model.href}
                      onClick={onClose}
                      className="flex w-full items-center justify-between gap-3 rounded-lg py-2.5 transition-colors active:bg-neutral-50"
                    >
                      <h2 className="min-w-0 flex-1 text-4xl font-semibold tracking-tight text-neutral-900">
                        {model.name}
                      </h2>
                      <ChevronRight className="size-5 shrink-0 text-neutral-400" />
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
          </m.div>
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
    <div className="mt-8">
      <p className="mb-3 text-sm font-medium text-neutral-500">{heading}</p>
      <ul className="space-y-2">
        {items.map((link) => (
          <li key={link.href + link.label}>
            <Link
              href={link.href}
              onClick={onClose}
              className="block py-1 text-[15px] text-neutral-800"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
