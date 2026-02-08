import { Suspense } from "react"
import { redirect } from "next/navigation"

import { CheckoutForm } from "@/components/storefront/checkout/checkout-form"
import { CheckoutSummary } from "@/components/storefront/checkout/checkout-summary"
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

  // Redirect to cart if empty
  if (!summary || summary.items.length === 0) {
    redirect("/cart")
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
