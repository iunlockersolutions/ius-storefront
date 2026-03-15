import { Suspense } from "react"
import Link from "next/link"

import { CheckoutForm } from "@/components/storefront/checkout/checkout-form"
import { CheckoutSummary } from "@/components/storefront/checkout/checkout-summary"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getCheckoutSummary, getUserAddresses } from "@/lib/actions/checkout"
import { getServerSession } from "@/lib/auth/rbac"

export const metadata = {
  title: "Checkout | IUS Shop",
  description: "Complete your order",
}

async function CheckoutContent() {
  const [summary, addresses, session] = await Promise.all([
    getCheckoutSummary(),
    getUserAddresses(),
    getServerSession(),
  ])

  // Avoid hard redirects here because checkout mutations can briefly re-render
  // this page with an empty cart before client navigation to success completes.
  if (!summary || summary.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-xl rounded-lg border p-6 text-center">
          <h1 className="text-2xl font-bold">Your checkout cart is empty</h1>
          <p className="mt-2 text-muted-foreground">
            Add items to your cart before proceeding to checkout.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button asChild variant="outline">
              <Link href="/cart">Back to Cart</Link>
            </Button>
            <Button asChild>
              <Link href="/products">Browse Products</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <CheckoutForm
            addresses={addresses}
            isLoggedIn={!!session?.user}
            userEmail={session?.user?.email || ""}
          />
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <CheckoutSummary summary={summary} />
        </div>
      </div>
    </div>
  )
}

function CheckoutSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-8 w-32 mb-8" />
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
        </div>
        <div className="lg:col-span-1">
          <Skeleton className="h-80" />
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <CheckoutContent />
    </Suspense>
  )
}
