"use client"

import * as React from "react"
import Link from "next/link"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { appleCatalog, getAppleCategoryById } from "./catalog"
import { APPLE_EASE_MOBILE } from "./nav-context"

const SLIDE_DURATION = 0.35

export function MobileShopTab({ onClose }: { onClose: () => void }) {
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const activeCategory = activeId ? getAppleCategoryById(activeId) : undefined

  return (
    <div className="relative flex-1 overflow-hidden">
      {/* Root level */}
      <motion.div
        className="absolute inset-0 overflow-y-auto bg-background px-6 py-4"
        animate={{ x: activeId ? "-100%" : "0%" }}
        transition={{ duration: SLIDE_DURATION, ease: APPLE_EASE_MOBILE }}
      >
        <ul className="space-y-1">
          {appleCatalog.map((category) => (
            <li key={category.id}>
              <button
                type="button"
                onClick={() => setActiveId(category.id)}
                className="flex w-full items-center justify-between py-2.5 text-left text-[28px] font-semibold tracking-tight text-neutral-900"
              >
                <span>{category.label}</span>
                <ChevronRight className="size-5 text-neutral-400" />
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
            className="absolute inset-0 overflow-y-auto bg-background px-6 py-4"
          >
            <div className="pb-2">
              <button
                type="button"
                aria-label="Back"
                onClick={() => setActiveId(null)}
                className="-ml-2 inline-flex size-10 items-center justify-center text-neutral-700"
              >
                <ChevronLeft className="size-6" />
              </button>
            </div>

            <ul className="space-y-1">
              <li>
                <Link
                  href={activeCategory.exploreAllHref}
                  onClick={onClose}
                  className="block py-2.5 text-[28px] font-semibold tracking-tight text-neutral-900"
                >
                  Explore All {activeCategory.label}
                </Link>
              </li>
              {activeCategory.models.map((model) => (
                <li key={model.name}>
                  <Link
                    href={model.href}
                    onClick={onClose}
                    className="block py-2.5 text-[28px] font-semibold tracking-tight text-neutral-900"
                  >
                    {model.name}
                  </Link>
                </li>
              ))}
            </ul>

            {activeCategory.shopLinks.length > 0 ? (
              <>
                <p className="mt-7 mb-2 text-sm text-neutral-500">
                  Shop {activeCategory.label}
                </p>
                <ul>
                  {activeCategory.shopLinks.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        onClick={onClose}
                        className="block py-2 text-base text-neutral-900"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {activeCategory.moreLinks.length > 0 ? (
              <>
                <p className="mt-7 mb-2 text-sm text-neutral-500">
                  More from {activeCategory.label}
                </p>
                <ul>
                  {activeCategory.moreLinks.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        onClick={onClose}
                        className="block py-2 text-base text-neutral-900"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
