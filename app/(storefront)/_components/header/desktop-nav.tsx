"use client"

import Link from "next/link"

import { Search, ShoppingBag, Tag } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { routes } from "@/configs/routes"
import { cn } from "@/lib/utils"

import { appleCatalog } from "./catalog"
import { BagFlyout, ProductFlyout, SearchFlyout } from "./flyout-panels"
import {
  APPLE_EASE,
  CURTAIN_DURATION,
  FADE_DURATION,
  FLYOUT_DURATION,
  useNav,
} from "./nav-context"

type DesktopNavProps = {
  cartCount: number
}

export function DesktopNav({ cartCount }: DesktopNavProps) {
  const {
    openKind,
    openPanelId,
    schedulePanel,
    scheduleClose,
    cancelScheduled,
    openPanel,
    openSearch,
    openBag,
    closeAll,
  } = useNav()

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
                    <motion.button
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
                        <motion.span
                          layoutId="desktop-nav-underline"
                          className="absolute inset-x-3 -bottom-px h-0.5 bg-indigo-600"
                          transition={{
                            duration: FADE_DURATION,
                            ease: APPLE_EASE,
                          }}
                        />
                      ) : null}
                    </motion.button>
                  </li>
                )
              })}
            </ul>

            {/* Right-side action group: Deals pill · Search · Bag */}
            <div className="flex shrink-0 items-center gap-1">
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
                <Search className="size-5" />
              </button>

              <button
                type="button"
                aria-label={`Bag (${cartCount} items)`}
                aria-expanded={openKind === "bag"}
                onClick={() => (openKind === "bag" ? closeAll() : openBag())}
                className="relative p-2 text-neutral-800 hover:text-neutral-950"
              >
                <ShoppingBag className="size-5" />
                {cartCount > 0 ? (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[9px] font-medium text-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                ) : null}
              </button>
            </div>
          </nav>
        </div>

        <AnimatePresence initial={false}>
          {hasAny ? (
            <motion.div
              key="flyout-wrap"
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              transition={{ duration: FLYOUT_DURATION, ease: APPLE_EASE }}
              className="absolute inset-x-0 top-full overflow-hidden border-b border-black/5 bg-white"
              onPointerEnter={cancelScheduled}
              onPointerLeave={scheduleClose}
            >
              <motion.div
                layout
                transition={{ duration: FLYOUT_DURATION, ease: APPLE_EASE }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {openKind === "panel" && activeCategory ? (
                    <motion.div
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
                    </motion.div>
                  ) : openKind === "search" ? (
                    <motion.div
                      key="panel-search"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        duration: FADE_DURATION,
                        ease: APPLE_EASE,
                      }}
                    >
                      <SearchFlyout onClose={closeAll} />
                    </motion.div>
                  ) : openKind === "bag" ? (
                    <motion.div
                      key="panel-bag"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        duration: FADE_DURATION,
                        ease: APPLE_EASE,
                      }}
                    >
                      <BagFlyout cartCount={cartCount} onNavigate={closeAll} />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            </motion.div>
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
        <motion.div
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
