import { Suspense } from "react"
import { redirect } from "next/navigation"

import { CheckoutForm } from "@/components/storefront/checkout/checkout-form"
import { Skeleton } from "@/components/ui/skeleton"
import { getCheckoutPageData } from "@/lib/actions/checkout"

export const metadata = {
  title: "Checkout | IUS Shop",
  description: "Complete your order",
}

async function CheckoutContent() {
  const checkoutData = await getCheckoutPageData()

  // Redirect to cart if empty
  if (!checkoutData || checkoutData.summary.items.length === 0) {
    redirect("/cart")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Sri Lanka Checkout
          </p>
          <h1 className="text-3xl font-bold mt-2">Complete your order</h1>
          <p className="text-muted-foreground mt-2">
            Secure one-page checkout with card, bank transfer, or cash on
            delivery.
          </p>
        </div>

        <CheckoutForm
          sessionId={checkoutData.sessionId}
          addresses={checkoutData.addresses}
          isLoggedIn={checkoutData.isLoggedIn}
          userEmail={checkoutData.userEmail}
          summary={checkoutData.summary}
          initialPricing={checkoutData.pricing}
          defaultInput={checkoutData.defaultInput}
        />
      </div>
    </div>
  )
}

function CheckoutSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-[640px] w-full" />
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
