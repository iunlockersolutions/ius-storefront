"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

import {
  AlertTriangle,
  Loader2,
  Minus,
  Package,
  Plus,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  clearCart,
  removeFromCart,
  updateCartItemQuantity,
} from "@/lib/actions/cart"

interface CartItem {
  id: string
  quantity: number
  priceAtAdd: string
  variant: {
    id: string
    name: string
    sku: string
    price: string
  }
  product: {
    id: string
    name: string
    slug: string
    status: string
  }
  inventory: {
    quantity: number
  } | null
  image: string | null
}

interface CartItemsProps {
  items: CartItem[]
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

function CartItemRow({ item }: { item: CartItem }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [quantity, setQuantity] = useState(item.quantity)

  const price = parseFloat(item.variant.price)
  const subtotal = price * quantity
  const maxQuantity = item.inventory?.quantity || 0
  const isOutOfStock = maxQuantity === 0
  const isLowStock = maxQuantity > 0 && maxQuantity <= 5
  const priceChanged = item.priceAtAdd !== item.variant.price

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > maxQuantity) return

    setQuantity(newQuantity)
    startTransition(async () => {
      const result = await updateCartItemQuantity(item.id, newQuantity)
      if (!result.success) {
        setQuantity(item.quantity)
        toast.error(result.error || "Failed to update quantity")
      } else {
        // Dispatch event to update cart badge
        window.dispatchEvent(new Event("cart-updated"))
      }
      router.refresh()
    })
  }

  const handleRemove = () => {
    startTransition(async () => {
      const result = await removeFromCart(item.id)
      if (result.success) {
        // Dispatch event to update cart badge
        window.dispatchEvent(new Event("cart-updated"))
        toast.success("Item removed from cart")
      } else {
        toast.error(result.error || "Failed to remove item")
      }
      router.refresh()
    })
  }

  return (
    <Card className={isOutOfStock ? "opacity-60" : ""}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Image */}
          <Link
            href={`/products/${item.product.slug}`}
            className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted"
          >
            {item.image ? (
              <Image
                src={item.image}
                alt={item.product.name}
                fill
                className="object-cover"
                sizes="96px"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </Link>

          {/* Details */}
          <div className="flex flex-1 flex-col">
            <div className="flex items-start justify-between">
              <div>
                <Link
                  href={`/products/${item.product.slug}`}
                  className="font-medium hover:text-primary transition-colors line-clamp-1"
                >
                  {item.product.name}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {item.variant.name}
                </p>
                {item.variant.sku && (
                  <p className="text-xs text-muted-foreground">
                    SKU: {item.variant.sku}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatCurrency(subtotal)}</p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(price)} each
                </p>
              </div>
            </div>

            {/* Warnings */}
            {(isOutOfStock || isLowStock || priceChanged) && (
              <div className="mt-2 flex flex-wrap gap-2">
                {isOutOfStock && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    Out of Stock
                  </Badge>
                )}
                {isLowStock && !isOutOfStock && (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-amber-100 text-amber-800"
                  >
                    Only {maxQuantity} left
                  </Badge>
                )}
                {priceChanged && (
                  <Badge variant="secondary" className="text-xs">
                    Price updated
                  </Badge>
                )}
              </div>
            )}

            {/* Quantity Controls */}
            <div className="mt-auto flex items-center justify-between pt-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={isPending || quantity <= 1 || isOutOfStock}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min={1}
                  max={maxQuantity}
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    if (val >= 1 && val <= maxQuantity) {
                      handleQuantityChange(val)
                    }
                  }}
                  className="h-8 w-16 text-center"
                  disabled={isPending || isOutOfStock}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={
                    isPending || quantity >= maxQuantity || isOutOfStock
                  }
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleRemove}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="mr-1 h-4 w-4" />
                    Remove
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function CartItems({ items }: CartItemsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleClearCart = () => {
    startTransition(async () => {
      const result = await clearCart()
      if (result.success) {
        // Dispatch event to update cart badge
        window.dispatchEvent(new Event("cart-updated"))
        toast.success("Cart cleared")
      } else {
        toast.error(result.error || "Failed to clear cart")
      }
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {items.length} {items.length === 1 ? "item" : "items"}
        </h2>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" disabled={isPending}>
              Clear Cart
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear your cart?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove all items from your cart. This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearCart}>
                Clear Cart
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <CartItemRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
