"use client"

import * as React from "react"
import Link from "next/link"

import { AnimatePresence, m } from "motion/react"

import { dealStripMessages } from "./catalog"

const ROTATE_INTERVAL_MS = 4500

export function DealsStrip() {
  const [index, setIndex] = React.useState(0)

  React.useEffect(() => {
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % dealStripMessages.length),
      ROTATE_INTERVAL_MS,
    )
    return () => window.clearInterval(id)
  }, [])

  const current = dealStripMessages[index]

  return (
    <div className="relative overflow-hidden bg-indigo-600 text-white">
      <div className="mx-auto flex h-deals-strip max-w-7xl items-center justify-center px-4 text-xs">
        <AnimatePresence mode="wait">
          <m.div
            key={current.id}
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
              {current.label}
            </Link>
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
