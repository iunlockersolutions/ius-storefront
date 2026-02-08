import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { format } from "date-fns"
import {
  ChevronLeft,
  Clock,
  CreditCard,
  Download,
  HelpCircle,
  MapPin,
  Package,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  getCustomerOrder,
  getOrderTimeline,
} from "@/lib/actions/customer-orders"
import { getServerSession } from "@/lib/auth/rbac"

import { CancelOrderButton } from "./cancel-order-button"
import { OrderTimeline } from "./order-timeline"

interface OrderDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: OrderDetailPageProps) {
  return {
    title: `Order Details | IUS Shop`,
    description: `View details for your order`,
  }
}

function formatCurrency(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num)
}

function getStatusConfig(status: string) {
  const configs: Record<
    string,
    {
      label: string
      variant: "default" | "secondary" | "destructive" | "outline"
      color: string
    }
  > = {
    draft: { label: "Draft", variant: "outline", color: "text-gray-500" },
    pending_payment: {
      label: "Pending Payment",
      variant: "secondary",
      color: "text-yellow-600",
    },
    paid: { label: "Paid", variant: "default", color: "text-green-600" },
    processing: {
      label: "Processing",
      variant: "default",
      color: "text-blue-600",
    },
    packing: { label: "Packing", variant: "default", color: "text-blue-600" },
    shipped: { label: "Shipped", variant: "default", color: "text-purple-600" },
    delivered: {
      label: "Delivered",
      variant: "secondary",
      color: "text-green-600",
    },
    cancelled: {
      label: "Cancelled",
      variant: "destructive",
      color: "text-red-600",
    },
    refunded: { label: "Refunded", variant: "outline", color: "text-gray-500" },
  }
  return (
    configs[status] || {
      label: status,
      variant: "outline" as const,
      color: "text-gray-500",
    }
  )
}

function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    card: "Credit/Debit Card",
    bank_transfer: "Bank Transfer",
    cod: "Cash on Delivery",
  }
  return labels[method] || method
}

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/orders")
  }

  const { id } = await params
  const [order, timeline] = await Promise.all([
    getCustomerOrder(id),
    getOrderTimeline(id),
  ])

  if (!order) {
    notFound()
  }

  const statusConfig = getStatusConfig(order.status)
  const canCancel = ["draft", "pending_payment", "paid"].includes(order.status)

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Link */}
      <Button variant="ghost" asChild className="mb-6 -ml-2">
        <Link href="/orders">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Orders
        </Link>
      </Button>

      {/* Order Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Order {order.orderNumber}</h1>
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
          {/* Order Items */}
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
                      <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">
                          {item.productName}
                        </h3>
                        {item.variantName && (
                          <p className="text-sm text-muted-foreground">
                            {item.variantName}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          SKU: {item.sku}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm">
                            {formatCurrency(item.unitPrice)} × {item.quantity}
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

          {/* Order Timeline */}
          {timeline && timeline.length > 0 && (
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
          )}

          {/* Shipping Address */}
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
                  {order.shippingAddress.phone && (
                    <p className="text-muted-foreground mt-2">
                      Phone: {order.shippingAddress.phone}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No shipping address available
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
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
                {parseFloat(order.discountAmount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(order.discountAmount)}</span>
                  </div>
                )}
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          {order.payment && (
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
          )}

          {/* Actions */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Button variant="outline" className="w-full" disabled>
                <Download className="h-4 w-4 mr-2" />
                Download Invoice
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/contact">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Need Help?
                </Link>
              </Button>
              {canCancel && <CancelOrderButton orderId={order.id} />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
