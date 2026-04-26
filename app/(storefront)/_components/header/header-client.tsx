"use client"

import * as React from "react"

import { domAnimation, LazyMotion } from "motion/react"

import { getCartCount } from "@/lib/actions/cart"

import { DealsStrip } from "./deals-strip"
import { DesktopNav } from "./desktop-nav"
import { MobileNav } from "./mobile-nav"
import { type HeaderUser } from "./types"

type HeaderClientProps = {
  user?: HeaderUser
}

export function HeaderClient({ user }: HeaderClientProps) {
  const [cartCount, setCartCount] = React.useState(0)

  React.useEffect(() => {
    let cancelled = false
    const refresh = async () => {
      const count = await getCartCount()
      if (!cancelled) setCartCount(count)
    }
    refresh()
    const onUpdate = () => refresh()
    window.addEventListener("cart-updated", onUpdate)
    return () => {
      cancelled = true
      window.removeEventListener("cart-updated", onUpdate)
    }
  }, [])

  return (
    <LazyMotion features={domAnimation}>
      <div className="sticky top-0 z-50">
        <DealsStrip />
        <div className="hidden lg:block">
          <DesktopNav cartCount={cartCount} />
        </div>
        <div className="lg:hidden">
          <MobileNav user={user} cartCount={cartCount} />
        </div>
      </div>
    </LazyMotion>
  )
}
