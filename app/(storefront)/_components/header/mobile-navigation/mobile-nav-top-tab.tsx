"use client"

import * as React from "react"

import { m } from "motion/react"

import { cn } from "@/lib/utils"

type MobileNavTopTabProps = {
  label: string
  icon: React.ReactNode
  selected: boolean
  onSelect: () => void
}

export function MobileNavTopTab({
  label,
  icon,
  selected,
  onSelect,
}: MobileNavTopTabProps) {
  return (
    <button
      role="tab"
      type="button"
      aria-selected={selected}
      onClick={onSelect}
      className={cn(
        "relative inline-flex items-center gap-1.5 pb-1.5 text-sm font-medium transition-colors",
        selected ? "text-indigo-600" : "text-neutral-500",
      )}
    >
      {icon}
      {label}
      {selected ? (
        <m.span
          layoutId="mobile-nav-top-indicator"
          className="absolute inset-x-0 -bottom-3 h-0.5 rounded-t bg-indigo-600"
          transition={{ duration: 0.2, ease: [0.4, 0, 0.6, 1] }}
        />
      ) : null}
    </button>
  )
}
