import Link from "next/link"
import { notFound } from "next/navigation"

import { format } from "date-fns"
import {
  Clock,
  CreditCard,
  HelpCircle,
  Home,
  MapPin,
  Package,
  Wallet,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  getGuestOrderByAccessToken,
  getGuestOrderTimeline,
} from "@/lib/actions/customer-orders"
import { formatCurrency } from "@/lib/utils"

import { OrderTimeline } from "../../../orders/[id]/order-timeline"

interface GuestOrderDetailPageProps {
  params: Promise<{ token: string }>
}

function getStatusConfig(status: string) {
  const configs: Record<
    string,
    {
      label: string
      variant: "default" | "secondary" | "destructive" | "outline"
    }
  > = {
    draft: { label: "Draft", variant: "outline" },
    pending_payment: { label: "Awaiting Payment", variant: "secondary" },
    paid: { label: "Paid", variant: "default" },
    processing: { label: "Processing", variant: "default" },
    packing: { label: "Packing", variant: "default" },
    shipped: { label: "Shipped", variant: "default" },
    delivered: { label: "Delivered", variant: "secondary" },
    cancelled: { label: "Cancelled", variant: "destructive" },
    refunded: { label: "Refunded", variant: "outline" },
  }

  return (
    configs[status] || {
      label: status,
      variant: "outline" as const,
    }
  )
}

function getPaymentMethodLabel(method: string) {
  const labels: Record<string, string> = {
    card: "Credit / Debit Card",
    bank_transfer: "Bank Transfer",
    cash_on_delivery: "Cash on Delivery",
  }

  return labels[method] || method
}

export default async function GuestOrderDetailPage({
  params,
}: GuestOrderDetailPageProps) {
  const { token } = await params
  const [order, timeline] = await Promise.all([
    getGuestOrderByAccessToken(token),
    getGuestOrderTimeline(token),
  ])

  if (!order) {
    notFound()
  }

  const statusConfig = getStatusConfig(order.status)
  const canCompleteBankTransfer =
    order.payment?.method === "bank_transfer" &&
    order.payment.status === "pending"

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Badge variant="outline">Secure guest access</Badge>
        <p className="text-sm text-muted-foreground">
          Save this link or use the confirmation email to reopen your order.
        </p>
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold">Order {order.orderNumber}</h1>
          <p className="text-muted-foreground">
            Placed on{" "}
            {format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
        <Badge
          variant={statusConfig.variant}
          className="w-fit text-base px-4 py-1"
        >
          {statusConfig.label}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={item.id}>
                    {index > 0 && <Separator className="mb-4" />}
                    <div className="flex gap-4">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-medium">
                          {item.productName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {item.variantName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          SKU: {item.sku}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-sm">
                            {formatCurrency(item.unitPrice)} x {item.quantity}
                          </span>
                          <span className="font-medium">
                            {formatCurrency(item.subtotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {timeline && timeline.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Order Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <OrderTimeline
                  timeline={timeline}
                  currentStatus={order.status}
                />
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.shippingAddress ? (
                <div className="text-sm">
                  <p className="font-medium">
                    {order.shippingAddress.recipientName}
                  </p>
                  <p className="text-muted-foreground">
                    {order.shippingAddress.addressLine1}
                  </p>
                  {order.shippingAddress.addressLine2 ? (
                    <p className="text-muted-foreground">
                      {order.shippingAddress.addressLine2}
                    </p>
                  ) : null}
                  <p className="text-muted-foreground">
                    {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                    {order.shippingAddress.postalCode}
                  </p>
                  <p className="text-muted-foreground">
                    {order.shippingAddress.country}
                  </p>
                  {order.shippingAddress.phone ? (
                    <p className="mt-2 text-muted-foreground">
                      Phone: {order.shippingAddress.phone}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No shipping address available
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{formatCurrency(order.shippingCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(order.taxAmount)}</span>
                </div>
                {Number.parseFloat(order.discountAmount) > 0 ? (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(order.discountAmount)}</span>
                  </div>
                ) : null}
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </CardContent>
          </Card>

          {order.payment ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method</span>
                  <span>{getPaymentMethodLabel(order.payment.method)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge
                    variant={
                      order.payment.status === "completed"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {order.payment.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardContent className="space-y-3 pt-6">
              {canCompleteBankTransfer ? (
                <Button asChild className="w-full">
                  <Link href={`/guest/orders/${token}/bank-transfer`}>
                    <Wallet className="mr-2 h-4 w-4" />
                    Complete Bank Transfer
                  </Link>
                </Button>
              ) : null}
              <Button asChild variant="outline" className="w-full">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/contact">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Need Help?
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
