"use client"

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"

const DEFAULT_DESKTOP_WIDTH = "22rem"

export interface OpsRightRailConfig {
  isVisible: boolean
  desktopContent: ReactNode | null
  mobileContent: ReactNode | null
  desktopWidth?: string
  mobileTitle?: string
  mobileDescription?: string
}

interface OpsRightRailState extends OpsRightRailConfig {
  desktopWidth: string
  mobileTitle: string
  mobileDescription: string
  mobileOpen: boolean
}

interface OpsRightRailContextValue extends OpsRightRailState {
  setRail: (config: OpsRightRailConfig) => void
  clearRail: () => void
  openMobileRail: () => void
  closeMobileRail: () => void
}

const initialState: OpsRightRailState = {
  isVisible: false,
  desktopContent: null,
  mobileContent: null,
  desktopWidth: DEFAULT_DESKTOP_WIDTH,
  mobileTitle: "",
  mobileDescription: "",
  mobileOpen: false,
}

const OpsRightRailContext = createContext<OpsRightRailContextValue | null>(null)

export function OpsRightRailProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OpsRightRailState>(initialState)

  const setRail = useCallback((config: OpsRightRailConfig) => {
    setState((current) => ({
      isVisible: config.isVisible,
      desktopContent: config.desktopContent,
      mobileContent: config.mobileContent,
      desktopWidth: config.desktopWidth ?? DEFAULT_DESKTOP_WIDTH,
      mobileTitle: config.mobileTitle ?? "",
      mobileDescription: config.mobileDescription ?? "",
      mobileOpen: config.isVisible ? current.mobileOpen : false,
    }))
  }, [])

  const clearRail = useCallback(() => {
    setState(initialState)
  }, [])

  const openMobileRail = useCallback(() => {
    setState((current) =>
      current.isVisible && current.mobileContent
        ? { ...current, mobileOpen: true }
        : current,
    )
  }, [])

  const closeMobileRail = useCallback(() => {
    setState((current) =>
      current.mobileOpen ? { ...current, mobileOpen: false } : current,
    )
  }, [])

  const value = useMemo<OpsRightRailContextValue>(
    () => ({
      ...state,
      clearRail,
      setRail,
      openMobileRail,
      closeMobileRail,
    }),
    [clearRail, closeMobileRail, openMobileRail, setRail, state],
  )

  return (
    <OpsRightRailContext.Provider value={value}>
      {children}
    </OpsRightRailContext.Provider>
  )
}

export function useOpsRightRail() {
  const context = useContext(OpsRightRailContext)

  if (!context) {
    throw new Error(
      "useOpsRightRail must be used within an OpsRightRailProvider",
    )
  }

  return context
}
