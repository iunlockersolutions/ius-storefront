import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { verifyCardPaymentForOrder } from "@/lib/actions/payment"

interface CheckoutCompletePageProps {
  searchParams: Promise<{
    orderId?: string
    token?: string
    cancelled?: string
    failed?: string
  }>
}

export const metadata = {
  title: "Payment status | IUS Shop",
  description: "Verify your payment and continue your order",
}

export default async function CheckoutCompletePage({
  searchParams,
}: CheckoutCompletePageProps) {
  const params = await searchParams

  if (!params.orderId || !params.token) {
    notFound()
  }

  if (params.cancelled === "1" || params.failed === "1") {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle
                className={`h-5 w-5 ${
                  params.cancelled === "1"
                    ? "text-amber-500"
                    : "text-destructive"
                }`}
              />
              {params.cancelled === "1"
                ? "Payment cancelled"
                : "Payment failed"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {params.cancelled === "1"
                ? "Your card payment was cancelled. You can return to checkout and try again."
                : "Your card payment was not completed. We restored your cart so you can review it and try again."}
            </p>
            <Button asChild>
              <Link href="/cart">
                {params.cancelled === "1"
                  ? "Return to checkout"
                  : "Return to cart"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const result = await verifyCardPaymentForOrder(params.orderId)

  if (!result.success) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              We could not verify your payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{result.error}</p>
            <Button asChild>
              <Link href="/checkout">Back to checkout</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (result.status === "completed") {
    redirect(`/checkout/success?token=${params.token}`)
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {result.status === "pending" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-destructive" />
            )}
            {result.status === "pending"
              ? "Waiting for payment confirmation"
              : "Payment was not completed"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {result.status === "pending"
              ? "Refresh this page after the payment provider confirms the transaction."
              : "Your payment did not complete successfully. You can start checkout again."}
          </p>
          <div className="flex gap-3">
            {result.status === "pending" ? (
              <Button asChild>
                <Link
                  href={`/checkout/complete?orderId=${params.orderId}&token=${params.token}`}
                >
                  Check again
                </Link>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/cart">Back to cart</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
