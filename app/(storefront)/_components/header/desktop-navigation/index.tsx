"use client"

import * as React from "react"
import Link from "next/link"

import {
  CreditCard,
  Search as SearchIcon,
  ShoppingBag,
  Tag,
} from "lucide-react"
import { AnimatePresence, m } from "motion/react"

import { routes } from "@/configs/routes"
import { cn } from "@/lib/utils"

import { appleCatalog } from "../catalog"
import { Search } from "../search"
import { type HeaderUser } from "../types"
import { DesktopAccountMenu } from "./desktop-account-menu"
import { ProductFlyout } from "./product-flyout"

type DesktopNavigationProps = {
  cartCount: number
  user?: HeaderUser
}

type DesktopOpenKind = "panel" | "search" | null

const APPLE_EASE = [0.4, 0, 0.6, 1] as const
const OPEN_DELAY_MS = 120
const CLOSE_DELAY_MS = 120
const FLYOUT_DURATION = 0.35
const FADE_DURATION = 0.15
const CURTAIN_DURATION = 0.2

export function DesktopNavigation({ cartCount, user }: DesktopNavigationProps) {
  const [openKind, setOpenKind] = React.useState<DesktopOpenKind>(null)
  const [openPanelId, setOpenPanelId] = React.useState<string | null>(null)
  const openTimer = React.useRef<number | null>(null)
  const closeTimer = React.useRef<number | null>(null)

  const clearTimers = React.useCallback(() => {
    if (openTimer.current !== null) {
      window.clearTimeout(openTimer.current)
      openTimer.current = null
    }
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])

  const closeAll = React.useCallback(() => {
    clearTimers()
    setOpenKind(null)
    setOpenPanelId(null)
  }, [clearTimers])

  const openPanel = React.useCallback(
    (id: string) => {
      clearTimers()
      setOpenKind("panel")
      setOpenPanelId(id)
    },
    [clearTimers],
  )

  const openSearch = React.useCallback(() => {
    clearTimers()
    setOpenKind("search")
    setOpenPanelId(null)
  }, [clearTimers])

  const schedulePanel = React.useCallback(
    (id: string) => {
      if (closeTimer.current !== null) {
        window.clearTimeout(closeTimer.current)
        closeTimer.current = null
      }
      if (openKind === "panel" && openPanelId !== null) {
        setOpenPanelId(id)
        return
      }
      if (openTimer.current !== null) window.clearTimeout(openTimer.current)
      openTimer.current = window.setTimeout(() => {
        setOpenKind("panel")
        setOpenPanelId(id)
        openTimer.current = null
      }, OPEN_DELAY_MS)
    },
    [openKind, openPanelId],
  )

  const scheduleClose = React.useCallback(() => {
    if (openTimer.current !== null) {
      window.clearTimeout(openTimer.current)
      openTimer.current = null
    }
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => {
      setOpenKind(null)
      setOpenPanelId(null)
      closeTimer.current = null
    }, CLOSE_DELAY_MS)
  }, [])

  const cancelScheduled = React.useCallback(() => clearTimers(), [clearTimers])

  React.useEffect(() => {
    if (openKind === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAll()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [openKind, closeAll])

  React.useEffect(() => () => clearTimers(), [clearTimers])

  const hasAny = openKind !== null
  const activeCategory =
    openKind === "panel" && openPanelId
      ? appleCatalog.find((c) => c.id === openPanelId)
      : undefined

  return (
    <>
      <Curtain open={hasAny} onClick={closeAll} />

      <div
        className="relative z-50"
        onPointerEnter={cancelScheduled}
        onPointerLeave={scheduleClose}
      >
        <div
          className={cn(
            "relative border-b bg-white transition-colors",
            hasAny ? "border-transparent" : "border-black/5",
          )}
        >
          <nav
            aria-label="Primary"
            className=" flex h-nav w-full mx-auto container items-center gap-4 px-6 text-sm"
          >
            {/* Logo */}
            <Link
              href="/"
              className="flex shrink-0 items-center text-lg font-semibold tracking-tight text-neutral-900"
            >
              Evolu<span className="text-indigo-600">X</span>
            </Link>

            {/* Category triggers */}
            <ul className="flex flex-1 items-center">
              {appleCatalog.map((category) => {
                const isActive =
                  openKind === "panel" && openPanelId === category.id

                return (
                  <li key={category.id}>
                    <m.button
                      type="button"
                      aria-expanded={isActive}
                      aria-haspopup="true"
                      className="relative px-3 py-2 font-medium whitespace-nowrap text-neutral-700 hover:text-neutral-900"
                      animate={{
                        color: isActive ? "rgb(79 70 229)" : "rgb(64 64 64)",
                      }}
                      transition={{
                        duration: FADE_DURATION,
                        ease: APPLE_EASE,
                      }}
                      onPointerEnter={() => schedulePanel(category.id)}
                      onFocus={() => openPanel(category.id)}
                      onClick={() =>
                        isActive ? closeAll() : openPanel(category.id)
                      }
                    >
                      {category.label}
                      {isActive ? (
                        <m.span
                          layoutId="desktop-nav-underline"
                          className="absolute inset-x-3 -bottom-px h-0.5 bg-indigo-600"
                          transition={{
                            duration: FADE_DURATION,
                            ease: APPLE_EASE,
                          }}
                        />
                      ) : null}
                    </m.button>
                  </li>
                )
              })}
            </ul>

            {/* Right-side action group: Deals pill · Search · Bag */}
            <div className="flex shrink-0 items-center gap-1">
              <Link
                href={routes.storefront.installmentPlans.root}
                className="mr-1 inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
              >
                <CreditCard className="size-3.5" />
                0% Plans
              </Link>

              <Link
                href={routes.storefront.deals.root}
                className="mr-1 inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500"
              >
                <Tag className="size-3.5" />
                Deals
              </Link>

              <button
                type="button"
                aria-label="Search"
                aria-expanded={openKind === "search"}
                onClick={() =>
                  openKind === "search" ? closeAll() : openSearch()
                }
                className="p-2 text-neutral-800 hover:text-neutral-950"
              >
                <SearchIcon className="size-5" />
              </button>

              <Link
                href={routes.storefront.cart.root}
                aria-label={`Bag (${cartCount} items)`}
                onClick={closeAll}
                className="relative p-2 text-neutral-800 hover:text-neutral-950"
              >
                <ShoppingBag className="size-5" />
                {cartCount > 0 ? (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[9px] font-medium text-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                ) : null}
              </Link>

              <DesktopAccountMenu user={user} />
            </div>
          </nav>
        </div>

        <AnimatePresence initial={false}>
          {hasAny ? (
            <m.div
              key="flyout-wrap"
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              transition={{ duration: FLYOUT_DURATION, ease: APPLE_EASE }}
              className="absolute inset-x-0 top-full overflow-hidden border-b border-black/5 bg-white"
              onPointerEnter={cancelScheduled}
              onPointerLeave={scheduleClose}
            >
              <m.div
                layout
                transition={{ duration: FLYOUT_DURATION, ease: APPLE_EASE }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {openKind === "panel" && activeCategory ? (
                    <m.div
                      key={`panel-${activeCategory.id}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        duration: FADE_DURATION,
                        ease: APPLE_EASE,
                      }}
                    >
                      <ProductFlyout
                        category={activeCategory}
                        onNavigate={closeAll}
                      />
                    </m.div>
                  ) : openKind === "search" ? (
                    <m.div
                      key="panel-search"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        duration: FADE_DURATION,
                        ease: APPLE_EASE,
                      }}
                    >
                      <Search onClose={closeAll} variant="desktop" />
                    </m.div>
                  ) : null}
                </AnimatePresence>
              </m.div>
            </m.div>
          ) : null}
        </AnimatePresence>
      </div>
    </>
  )
}

function Curtain({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <AnimatePresence>
      {open ? (
        <m.div
          key="curtain"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: CURTAIN_DURATION,
            ease: APPLE_EASE,
            delay: 0.05,
          }}
          aria-hidden="true"
          onClick={onClick}
          className="fixed inset-0 z-40 bg-black/15 backdrop-blur-[2px]"
        />
      ) : null}
    </AnimatePresence>
  )
}
