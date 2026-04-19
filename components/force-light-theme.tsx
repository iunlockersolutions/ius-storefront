"use client"

import { useEffect } from "react"

export function ForceLightTheme() {
  useEffect(() => {
    const root = document.documentElement

    root.classList.remove("dark")
    root.classList.add("light")
    root.setAttribute("data-theme", "light")
    root.style.colorScheme = "light"
  }, [])

  return null
}
