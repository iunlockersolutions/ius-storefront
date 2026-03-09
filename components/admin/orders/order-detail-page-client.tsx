"use client"

import Link from "next/link"

import { ChevronLeft } from "lucide-react"

import { OrderDetail } from "@/components/admin/orders/order-detail"
import {
  AdminQueryEmptyState,
  AdminQueryErrorState,
  AdminQueryLoadingState,
  getQueryErrorMessage,
} from "@/components/admin/query-state"
import { Button } from "@/components/ui/button"
import { useAdminOrderQuery } from "@/hooks/admin/use-admin-order-query"

interface OrderDetailPageClientProps {
  orderId: string
}

export function OrderDetailPageClient({ orderId }: OrderDetailPageClientProps) {
  const orderQuery = useAdminOrderQuery(orderId)

  if (orderQuery.isLoading || orderQuery.isFetching) {
    return <AdminQueryLoadingState />
  }

  if (orderQuery.error) {
    return (
      <AdminQueryErrorState
        message={getQueryErrorMessage(orderQuery.error, "Failed to load order")}
        onRetry={orderQuery.refetch}
        backHref="/ops/orders"
        backLabel="Back to Orders"
      />
    )
  }

  if (!orderQuery.data) {
    return (
      <AdminQueryEmptyState
        message="Order not found."
        backHref="/ops/orders"
        backLabel="Back to Orders"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/ops/orders">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            Order {orderQuery.data.orderNumber}
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage order details and status
          </p>
        </div>
      </div>

      <OrderDetail order={orderQuery.data} />
    </div>
  )
}
