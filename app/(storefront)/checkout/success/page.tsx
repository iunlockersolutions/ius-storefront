import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { eq } from "drizzle-orm"
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Home,
  Mail,
  MapPin,
  Package,
  Truck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"

export const metadata = {
  title: "Order Confirmed | IUS Shop",
  description: "Your order has been placed successfully",
}

interface SuccessPageProps {
  searchParams: Promise<{ orderId?: string }>
}

function formatCurrency(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num)
}

async function OrderConfirmation({ orderId }: { orderId: string }) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      items: true,
    },
  })

  if (!order) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
        <p className="text-muted-foreground">
          Thank you for your order. We&apos;ve received your order and will
          begin processing it shortly.
        </p>
      </div>

      {/* Order Number */}
      <Card className="mb-6">
        <CardContent className="py-6 text-center">
          <p className="text-sm text-muted-foreground mb-1">Order Number</p>
          <p className="text-2xl font-mono font-bold">{order.orderNumber}</p>
          <p className="text-sm text-muted-foreground mt-2">
            A confirmation email has been sent to{" "}
            <span className="font-medium text-foreground">
              {order.customerEmail}
            </span>
          </p>
        </CardContent>
      </Card>

      {/* Order Details */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* Shipping Address */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Shipping Address
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {order.shippingAddress ? (
              <>
                <p className="font-medium">
                  {order.shippingAddress.recipientName}
                </p>
                <p className="text-muted-foreground">
                  {order.shippingAddress.addressLine1}
                </p>
                {order.shippingAddress.addressLine2 && (
                  <p className="text-muted-foreground">
                    {order.shippingAddress.addressLine2}
                  </p>
                )}
                <p className="text-muted-foreground">
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.postalCode}
                </p>
                <p className="text-muted-foreground">
                  {order.shippingAddress.country}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">
                No shipping address available
              </p>
            )}
          </CardContent>
        </Card>

        {/* Payment & Shipping */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <div>
              <p className="text-muted-foreground">Order Status</p>
              <p className="font-medium capitalize">
                {order.status.replace("_", " ")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Shipping</p>
              <p className="font-medium flex items-center gap-2">
                <Truck className="h-4 w-4" />
                {parseFloat(order.shippingCost) > 15
                  ? "Express (1-2 days)"
                  : "Standard (5-7 days)"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Package className="h-4 w-4" />
            Order Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.variantName} × {item.quantity}
                  </p>
                </div>
                <p className="font-medium">{formatCurrency(item.subtotal)}</p>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span>
                {parseFloat(order.shippingCost) === 0
                  ? "Free"
                  : formatCurrency(order.shippingCost)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatCurrency(order.taxAmount)}</span>
            </div>
            {parseFloat(order.discountAmount) > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-medium text-lg">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What's Next */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            What&apos;s Next?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Confirmation Email</p>
                <p className="text-sm text-muted-foreground">
                  You&apos;ll receive an order confirmation email with your
                  order details.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Order Processing</p>
                <p className="text-sm text-muted-foreground">
                  We&apos;ll prepare your items for shipment and notify you when
                  they&apos;re on the way.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Truck className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Shipping Updates</p>
                <p className="text-sm text-muted-foreground">
                  Track your package with the tracking number we&apos;ll send
                  once shipped.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild className="flex-1">
          <Link href="/products">
            Continue Shopping
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  )
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
      <OrderConfirmation orderId={orderId} />
    </Suspense>
  )
}
