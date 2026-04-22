"use client"

import * as React from "react"

export const APPLE_EASE = [0.4, 0, 0.6, 1] as const
export const APPLE_EASE_MOBILE = [0.52, 0.16, 0.24, 1] as const
export const FLYOUT_DURATION = 0.35
export const FADE_DURATION = 0.15
export const CURTAIN_DURATION = 0.2

const OPEN_DELAY_MS = 120
const CLOSE_DELAY_MS = 120

export type NavOpenKind = "panel" | "search" | "bag" | null

type NavContextValue = {
  openKind: NavOpenKind
  openPanelId: string | null
  openPanel: (id: string) => void
  closeAll: () => void
  openSearch: () => void
  openBag: () => void
  schedulePanel: (id: string) => void
  scheduleClose: () => void
  cancelScheduled: () => void
}

const NavContext = React.createContext<NavContextValue | null>(null)

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [openKind, setOpenKind] = React.useState<NavOpenKind>(null)
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

  const openBag = React.useCallback(() => {
    clearTimers()
    setOpenKind("bag")
    setOpenPanelId(null)
  }, [clearTimers])

  const closeAll = React.useCallback(() => {
    clearTimers()
    setOpenKind(null)
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

  const value = React.useMemo<NavContextValue>(
    () => ({
      openKind,
      openPanelId,
      openPanel,
      closeAll,
      openSearch,
      openBag,
      schedulePanel,
      scheduleClose,
      cancelScheduled,
    }),
    [
      openKind,
      openPanelId,
      openPanel,
      closeAll,
      openSearch,
      openBag,
      schedulePanel,
      scheduleClose,
      cancelScheduled,
    ],
  )

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>
}

export function useNav() {
  const ctx = React.useContext(NavContext)
  if (!ctx) throw new Error("useNav must be used inside NavProvider")
  return ctx
}
