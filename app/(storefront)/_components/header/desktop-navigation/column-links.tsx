"use client"

import Link from "next/link"

import { m } from "motion/react"

import { cn } from "@/lib/utils"

import { itemVariants } from "./animation"

type ColumnLinkItem = {
  label: string
  href: string
  bold?: boolean
}

type ColumnLinksProps = {
  heading: string
  items: ColumnLinkItem[]
  onNavigate: () => void
}

export function ColumnLinks({ heading, items, onNavigate }: ColumnLinksProps) {
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
