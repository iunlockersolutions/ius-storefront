import { Suspense } from "react"
import Link from "next/link"

import { ArrowLeft, ShoppingBag } from "lucide-react"

import { CartItems } from "@/components/storefront/cart-items"
import { CartSummary } from "@/components/storefront/cart-summary"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getCart } from "@/lib/actions/cart"

export const metadata = {
  title: "Shopping Cart | IUS Shop",
  description: "Review your shopping cart and proceed to checkout",
}

async function CartContent() {
  const cart = await getCart()

  if (cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-6 rounded-full bg-muted p-6">
          <ShoppingBag className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="mb-2 text-2xl font-semibold">Your cart is empty</h2>
        <p className="mb-6 text-muted-foreground max-w-md">
          Looks like you haven&apos;t added anything to your cart yet. Start
          shopping to fill it up!
        </p>
        <Button asChild size="lg">
          <Link href="/products">Continue Shopping</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <CartItems items={cart.items} />
      </div>
      <div className="lg:col-span-1">
        <CartSummary subtotal={cart.subtotal} itemCount={cart.itemCount} />
      </div>
    </div>
  )
}

export default function CartPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href="/products"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Continue Shopping
        </Link>
        <h1 className="text-3xl font-bold">Shopping Cart</h1>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
            <div className="lg:col-span-1">
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        }
      >
        <CartContent />
      </Suspense>
    </div>
  )
}
