import Link from "next/link"
import { redirect } from "next/navigation"

import { formatDistanceToNow } from "date-fns"
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Package,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  getCustomerOrderCounts,
  getCustomerOrders,
} from "@/lib/actions/customer-orders"
import { getServerSession } from "@/lib/auth/rbac"

export const metadata = {
  title: "My Orders | IUS Shop",
  description: "View and track your orders",
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
      icon: React.ReactNode
    }
  > = {
    draft: {
      label: "Draft",
      variant: "outline",
      icon: <Clock className="h-3 w-3" />,
    },
    pending_payment: {
      label: "Pending Payment",
      variant: "secondary",
      icon: <Clock className="h-3 w-3" />,
    },
    paid: {
      label: "Paid",
      variant: "default",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    processing: {
      label: "Processing",
      variant: "default",
      icon: <Package className="h-3 w-3" />,
    },
    packing: {
      label: "Packing",
      variant: "default",
      icon: <Package className="h-3 w-3" />,
    },
    shipped: {
      label: "Shipped",
      variant: "default",
      icon: <Truck className="h-3 w-3" />,
    },
    delivered: {
      label: "Delivered",
      variant: "secondary",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    cancelled: {
      label: "Cancelled",
      variant: "destructive",
      icon: <XCircle className="h-3 w-3" />,
    },
    refunded: {
      label: "Refunded",
      variant: "outline",
      icon: <XCircle className="h-3 w-3" />,
    },
  }
  return (
    configs[status] || {
      label: status,
      variant: "outline" as const,
      icon: null,
    }
  )
}

interface OrdersPageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/orders")
  }

  const { page } = await searchParams
  const currentPage = parseInt(page || "1", 10)

  const [ordersData, counts] = await Promise.all([
    getCustomerOrders(currentPage, 10),
    getCustomerOrderCounts(),
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <p className="text-muted-foreground">
          View and track your order history
        </p>
      </div>

      {/* Order Stats */}
      {counts && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{counts.total}</p>
              <p className="text-xs text-muted-foreground">Total Orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {counts.pending}
              </p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {counts.processing}
              </p>
              <p className="text-xs text-muted-foreground">Processing</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">
                {counts.shipped}
              </p>
              <p className="text-xs text-muted-foreground">Shipped</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {counts.delivered}
              </p>
              <p className="text-xs text-muted-foreground">Delivered</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Orders List */}
      {ordersData.orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-4">
              When you place an order, it will appear here.
            </p>
            <Button asChild>
              <Link href="/products">Start Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {ordersData.orders.map((order) => {
            const statusConfig = getStatusConfig(order.status)
            return (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="bg-muted/30 py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Order</p>
                        <p className="font-mono font-semibold">
                          {order.orderNumber}
                        </p>
                      </div>
                      <Separator
                        orientation="vertical"
                        className="h-8 hidden sm:block"
                      />
                      <div className="hidden sm:block">
                        <p className="text-sm text-muted-foreground">Placed</p>
                        <p className="text-sm">
                          {formatDistanceToNow(new Date(order.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge variant={statusConfig.variant} className="w-fit">
                      {statusConfig.icon}
                      <span className="ml-1">{statusConfig.label}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {order.firstItem?.productName || "Order Items"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {order.itemCount}{" "}
                          {order.itemCount === 1 ? "item" : "items"} ·{" "}
                          {formatCurrency(order.total)}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/orders/${order.id}`}>
                        View Details
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {/* Pagination */}
          {ordersData.pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {currentPage > 1 && (
                <Button variant="outline" asChild>
                  <Link href={`/orders?page=${currentPage - 1}`}>Previous</Link>
                </Button>
              )}
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Page {currentPage} of {ordersData.pagination.totalPages}
              </span>
              {currentPage < ordersData.pagination.totalPages && (
                <Button variant="outline" asChild>
                  <Link href={`/orders?page=${currentPage + 1}`}>Next</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
