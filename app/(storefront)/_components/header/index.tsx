"use client"

import * as React from "react"

import { domAnimation, LazyMotion } from "motion/react"

import { getCartCount } from "@/lib/actions/cart"

import { DealsStrip } from "./deals-strip"
import { DesktopNavigation } from "./desktop-navigation"
import { isStaffHeaderUser } from "./header-utils"
import { MobileNavigation } from "./mobile-navigation"
import { type HeaderUser } from "./types"

type HeaderProps = {
  user?: HeaderUser
}

export function Header({ user }: HeaderProps) {
  const [cartCount, setCartCount] = React.useState(0)
  const isStaffUser = isStaffHeaderUser(user)

  React.useEffect(() => {
    if (isStaffUser) {
      return
    }

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
  }, [isStaffUser])

  return (
    <LazyMotion features={domAnimation}>
      <div className="sticky top-0 z-50">
        <DealsStrip />
        <div className="hidden lg:block">
          <DesktopNavigation
            cartCount={isStaffUser ? 0 : cartCount}
            user={user}
          />
        </div>
        <div className="lg:hidden">
          <MobileNavigation
            user={user}
            cartCount={isStaffUser ? 0 : cartCount}
          />
        </div>
      </div>
    </LazyMotion>
  )
}
