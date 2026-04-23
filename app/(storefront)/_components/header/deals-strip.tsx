"use client"

import * as React from "react"
import Link from "next/link"

import { AnimatePresence, motion } from "motion/react"

import { routes } from "@/configs/routes"

const MESSAGES: { text: string; href: string }[] = [
  { text: "Free shipping on orders over $50", href: routes.storefront.root },
  {
    text: "0% financing available at checkout",
    href: routes.storefront.deals.root,
  },
  { text: "30-day returns, no questions asked", href: routes.storefront.root },
  {
    text: "Trade in your old device for credit",
    href: routes.storefront.prodcuts.root,
  },
]

const ROTATE_INTERVAL_MS = 4500

export function DealsStrip() {
  const [index, setIndex] = React.useState(0)

  React.useEffect(() => {
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % MESSAGES.length),
      ROTATE_INTERVAL_MS,
    )
    return () => window.clearInterval(id)
  }, [])

  const current = MESSAGES[index]

  return (
    <div className="relative overflow-hidden bg-indigo-600 text-white">
      <div className="mx-auto flex h-deals-strip max-w-7xl items-center justify-center px-4 text-xs">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.6, 1] }}
            className="flex items-center"
          >
            <Link
              href={current.href}
              className="font-medium tracking-wide hover:underline"
            >
              {current.text}
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
