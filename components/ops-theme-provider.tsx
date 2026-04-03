"use client"

import type { ReactNode } from "react"
import { ThemeProvider } from "next-themes"

export function OpsThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
      enableSystem
      storageKey="ops-theme"
    >
      {children}
    </ThemeProvider>
  )
}
