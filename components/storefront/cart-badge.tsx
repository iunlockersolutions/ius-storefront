"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import { ShoppingCart } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getCartCount } from "@/lib/actions/cart"

/**
 * Cart Badge Component
 *
 * Displays cart icon with item count badge.
 * Fetches count on mount and listens for cart updates.
 */
export function CartBadge() {
  const [count, setCount] = useState(0)

  const fetchCount = async () => {
    const itemCount = await getCartCount()
    setCount(itemCount)
  }

  useEffect(() => {
    fetchCount()

    // Listen for cart updates
    const handleCartUpdate = () => {
      fetchCount()
    }

    window.addEventListener("cart-updated", handleCartUpdate)
    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate)
    }
  }, [])

  return (
    <Button variant="ghost" size="icon" asChild className="relative">
      <Link href="/cart">
        <ShoppingCart className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
            {count > 99 ? "99+" : count}
          </span>
        )}
        <span className="sr-only">Cart ({count} items)</span>
      </Link>
    </Button>
  )
}
