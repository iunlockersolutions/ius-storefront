"use client"

import { m } from "motion/react"

const BAR_CLASS = "absolute block h-[1.5px] w-[18px] rounded bg-current"
const TRANSITION = {
  duration: 0.2,
  ease: [0.04, 0.04, 0.12, 0.96] as const,
}

export function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="relative inline-flex size-5 items-center justify-center"
    >
      <m.span
        className={BAR_CLASS}
        animate={{ y: open ? 0 : -3, rotate: open ? 45 : 0 }}
        transition={TRANSITION}
      />
      <m.span
        className={BAR_CLASS}
        animate={{ y: open ? 0 : 3, rotate: open ? -45 : 0 }}
        transition={TRANSITION}
      />
    </span>
  )
}
