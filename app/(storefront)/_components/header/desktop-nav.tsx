"use client"

import Link from "next/link"

import { Search, ShoppingBag } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

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
  const searchOpen = openKind === "search"
  const activeCategory =
    openKind === "panel" && openPanelId
      ? appleCatalog.find((c) => c.id === openPanelId)
      : undefined

  return (
    <>
      <Curtain open={hasAny} onClick={closeAll} />

      <div
        className="sticky top-0 z-50"
        onPointerEnter={cancelScheduled}
        onPointerLeave={scheduleClose}
      >
        <div className="relative border-b border-black/5 bg-[rgb(250,250,252)]/80 backdrop-blur-xl backdrop-saturate-[1.8]">
          <nav
            aria-label="Primary"
            className="mx-auto flex h-11 w-full max-w-5xl items-center justify-between px-6 text-sm"
          >
            <motion.div
              animate={{ opacity: searchOpen ? 0 : 1 }}
              transition={{ duration: FADE_DURATION, ease: APPLE_EASE }}
              className="shrink-0"
            >
              <Link
                href="/"
                className="flex items-center text-base font-semibold tracking-tight"
              >
                Evolu<span className="text-indigo-600">X</span>
              </Link>
            </motion.div>

            <ul className="flex flex-1 items-center justify-center">
              {appleCatalog.map((category) => {
                const isActive =
                  openKind === "panel" && openPanelId === category.id
                const dimmed = searchOpen || (hasAny && !isActive)

                return (
                  <li key={category.id} className="px-2">
                    <motion.button
                      type="button"
                      aria-expanded={isActive}
                      aria-haspopup="true"
                      className="px-2 py-2 whitespace-nowrap text-neutral-800 hover:text-black"
                      animate={{ opacity: dimmed ? 0 : 1 }}
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
                    </motion.button>
                  </li>
                )
              })}
            </ul>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                aria-label="Search"
                aria-expanded={openKind === "search"}
                className="p-2 text-neutral-800 hover:text-black"
                onClick={() =>
                  openKind === "search" ? closeAll() : openSearch()
                }
              >
                <Search className="size-4" />
              </button>

              <button
                type="button"
                aria-label={`Bag (${cartCount} items)`}
                aria-expanded={openKind === "bag"}
                className="relative p-2 text-neutral-800 hover:text-black"
                onClick={() => (openKind === "bag" ? closeAll() : openBag())}
              >
                <ShoppingBag className="size-4" />
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
              className="absolute inset-x-0 top-full overflow-hidden border-b border-black/5 bg-[rgb(250,250,252)]/80 backdrop-blur-xl backdrop-saturate-[1.8]"
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
                      transition={{ duration: FADE_DURATION, ease: APPLE_EASE }}
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
                      transition={{ duration: FADE_DURATION, ease: APPLE_EASE }}
                    >
                      <SearchFlyout onClose={closeAll} />
                    </motion.div>
                  ) : openKind === "bag" ? (
                    <motion.div
                      key="panel-bag"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: FADE_DURATION, ease: APPLE_EASE }}
                    >
                      <BagFlyout onNavigate={closeAll} />
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
            delay: 0.08,
          }}
          aria-hidden="true"
          onClick={onClick}
          className="fixed inset-0 z-40 bg-[rgb(232,232,237)]/40 backdrop-blur-xl"
        />
      ) : null}
    </AnimatePresence>
  )
}
