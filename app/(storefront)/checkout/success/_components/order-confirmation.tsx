import Link from "next/link"

import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Home,
  LogIn,
  Mail,
  MapPin,
  Package,
  Truck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatCurrency, parseCurrencyAmount } from "@/lib/utils"

import type { getCheckoutSuccessOrder } from "../_actions/get-order-confirmation"

type CheckoutSuccessOrder = NonNullable<
  Awaited<ReturnType<typeof getCheckoutSuccessOrder>>
>

export function OrderConfirmation({
  order,
  token,
}: {
  order: CheckoutSuccessOrder
  token: string
}) {
  const isGuestOrder = !order.userId
  const orderHref = isGuestOrder
    ? `/guest/orders/${token}`
    : `/orders/${order.id}`
  const bankTransferHref = isGuestOrder
    ? `/guest/orders/${token}/bank-transfer`
    : `/orders/${order.id}/bank-transfer`
  const shouldShowBankTransfer = order.paymentMethod === "bank_transfer"
  const shippingRegion = order.shippingAddress?.state || ""

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
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

      <div className="grid gap-6 md:grid-cols-2 mb-6">
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
                  {order.shippingAddress.city}
                  {shippingRegion ? `, ${shippingRegion}` : ""}{" "}
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
                {order.shippingMethod === "express"
                  ? "Express delivery"
                  : "Standard delivery"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Payment Method</p>
              <p className="font-medium capitalize">
                {order.paymentMethod?.replaceAll("_", " ") || "Card"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

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
                {parseCurrencyAmount(order.shippingCost) === 0
                  ? "Free"
                  : formatCurrency(order.shippingCost)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatCurrency(order.taxAmount)}</span>
            </div>
            {parseCurrencyAmount(order.discountAmount) > 0 && (
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
                  We&apos;ve sent your order confirmation email. A paid
                  invoice/receipt email will follow as soon as payment is
                  completed.
                </p>
              </div>
            </div>
            {shouldShowBankTransfer ? (
              <div className="flex gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Complete your bank transfer</p>
                  <p className="text-sm text-muted-foreground">
                    Use the secure payment instructions page to transfer the
                    exact amount and upload proof of payment for review.
                  </p>
                </div>
              </div>
            ) : null}
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

      {isGuestOrder ? (
        <Card className="mb-6 border-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Save this order to a new account
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Create an account with{" "}
              <span className="font-medium text-foreground">
                {order.customerEmail}
              </span>{" "}
              and we&apos;ll connect eligible guest orders to your order
              history.
            </p>
            <Button asChild variant="outline">
              <Link href="/auth/register?callbackUrl=/orders">
                <LogIn className="mr-2 h-4 w-4" />
                Create account
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild className="flex-1">
          <Link
            href={
              order.paymentMethod === "bank_transfer"
                ? bankTransferHref
                : orderHref
            }
          >
            {order.paymentMethod === "bank_transfer"
              ? "Complete Bank Transfer"
              : "View Order"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link href="/products">
            <Home className="mr-2 h-4 w-4" />
            Continue Shopping
          </Link>
        </Button>
      </div>
    </div>
  )
}
