"use client"

import { useState } from "react"

import { Loader2, ShoppingCart, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { moveToCart, removeFromFavorites } from "@/lib/actions/favorites"

interface FavoriteActionsProps {
  productId: string
  productName: string
}

export function FavoriteActions({
  productId,
  productName,
}: FavoriteActionsProps) {
  const [isMoving, setIsMoving] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  async function handleMoveToCart() {
    setIsMoving(true)
    try {
      const result = await moveToCart(productId)
      if (result.success) {
        toast.success(`${productName} moved to cart`)
      } else {
        toast.error(result.error || "Failed to move to cart")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setIsMoving(false)
    }
  }

  async function handleRemove() {
    setIsRemoving(true)
    try {
      const result = await removeFromFavorites(productId)
      if (result.success) {
        toast.success(`${productName} removed from favorites`)
      } else {
        toast.error(result.error || "Failed to remove from favorites")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <div className="flex gap-2 mt-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleMoveToCart}
        disabled={isMoving || isRemoving}
        className="flex-1"
      >
        {isMoving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <ShoppingCart className="h-4 w-4 mr-1" />
            Move to Cart
          </>
        )}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRemove}
        disabled={isMoving || isRemoving}
        className="text-destructive hover:text-destructive"
      >
        {isRemoving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}
