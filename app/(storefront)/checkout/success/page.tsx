import { Suspense } from "react"
import { notFound } from "next/navigation"

import { Skeleton } from "@/components/ui/skeleton"

import { getCheckoutSuccessOrder } from "./_actions/get-order-confirmation"
import { OrderConfirmation } from "./_components/order-confirmation"

export const metadata = {
  title: "Order Confirmed | IUS Shop",
  description: "Your order has been placed successfully",
}

interface SuccessPageProps {
  searchParams: Promise<{ orderId?: string }>
}

async function OrderConfirmationContent({ orderId }: { orderId: string }) {
  const order = await getCheckoutSuccessOrder(orderId)

  if (!order) {
    notFound()
  }

  return <OrderConfirmation order={order} />
}

function SuccessSkeleton() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="text-center mb-8">
        <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
        <Skeleton className="h-8 w-48 mx-auto mb-2" />
        <Skeleton className="h-4 w-72 mx-auto" />
      </div>
      <Skeleton className="h-32 mb-6" />
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
      <Skeleton className="h-64 mb-6" />
    </div>
  )
}

export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const params = await searchParams
  const orderId = params.orderId

  if (!orderId) {
    notFound()
  }

  return (
    <Suspense fallback={<SuccessSkeleton />}>
      <OrderConfirmationContent orderId={orderId} />
    </Suspense>
  )
}
