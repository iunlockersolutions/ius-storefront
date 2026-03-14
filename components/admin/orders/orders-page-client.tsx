"use client"

import { useEffect, useMemo } from "react"

import { useOpsRightRail } from "@/app/ops/_components/ops-right-rail-provider"
import { OrdersRightRail } from "@/components/admin/orders/orders-right-rail"
import { OrdersTable } from "@/components/admin/orders/orders-table"
import { useAdminOrdersQuery } from "@/hooks/admin/use-admin-orders-query"
import type {
  AdminOrderFulfillmentStatus,
  AdminOrderListView,
  AdminOrderPaymentStatus,
  AdminOrderStatus,
} from "@/lib/types/admin-order"

interface OrdersPageClientProps {
  page: number
  search: string
  status: AdminOrderStatus | ""
  paymentStatus: AdminOrderPaymentStatus | ""
  fulfillmentStatus: AdminOrderFulfillmentStatus | ""
  customerType: "all" | "guest" | "registered"
  shippingMethod: string
  view: AdminOrderListView
  sortBy:
    | "createdAt"
    | "updatedAt"
    | "latestActivityAt"
    | "total"
    | "customer"
    | "paymentStatus"
    | "fulfillmentStatus"
    | "orderNumber"
  sortOrder: "asc" | "desc"
}

export function OrdersPageClient({
  page,
  search,
  status,
  paymentStatus,
  fulfillmentStatus,
  customerType,
  shippingMethod,
  view,
  sortBy,
  sortOrder,
}: OrdersPageClientProps) {
  const { clearRail, closeMobileRail, setRail } = useOpsRightRail()
  const ordersQuery = useAdminOrdersQuery({
    page,
    limit: 20,
    search: search || undefined,
    status: status || undefined,
    paymentStatus: paymentStatus || undefined,
    fulfillmentStatus: fulfillmentStatus || undefined,
    customerType,
    shippingMethod: shippingMethod || undefined,
    view,
    sortBy,
    sortOrder,
  })
  const latestOrdersQuery = useAdminOrdersQuery({
    page: 1,
    limit: 8,
    sortBy: "latestActivityAt",
    sortOrder: "desc",
  })

  const attentionOrders = useMemo(() => {
    const source = [
      ...(latestOrdersQuery.data?.orders ?? []),
      ...(ordersQuery.data?.orders ?? []),
    ]

    return Array.from(
      new Map(source.map((order) => [order.id, order])).values(),
    )
      .filter((order) => order.progress.attentionState !== null)
      .sort(
        (left, right) =>
          new Date(right.latestActivityAt).getTime() -
          new Date(left.latestActivityAt).getTime(),
      )
      .slice(0, 8)
  }, [latestOrdersQuery.data?.orders, ordersQuery.data?.orders])

  useEffect(() => {
    setRail({
      isVisible: true,
      desktopContent: (
        <OrdersRightRail
          latestOrders={latestOrdersQuery.data?.orders ?? []}
          attentionOrders={attentionOrders}
        />
      ),
      mobileContent: (
        <OrdersRightRail
          latestOrders={latestOrdersQuery.data?.orders ?? []}
          attentionOrders={attentionOrders}
          onNavigate={closeMobileRail}
        />
      ),
      desktopWidth: "24rem",
      mobileTitle: "Order Queue",
      mobileDescription: "Latest activity and orders needing action.",
    })

    return clearRail
  }, [
    attentionOrders,
    clearRail,
    closeMobileRail,
    latestOrdersQuery.data?.orders,
    setRail,
  ])

  return (
    <OrdersTable
      orders={ordersQuery.data?.orders ?? []}
      total={ordersQuery.data?.pagination.total ?? 0}
      page={ordersQuery.data?.pagination.page ?? page}
      totalPages={ordersQuery.data?.pagination.totalPages ?? 0}
      search={search}
      status={status}
      paymentStatus={paymentStatus}
      fulfillmentStatus={fulfillmentStatus}
      customerType={customerType}
      shippingMethod={shippingMethod}
      view={view}
      sortBy={sortBy}
      sortOrder={sortOrder}
      isLoading={ordersQuery.isLoading || ordersQuery.isFetching}
      errorMessage={
        ordersQuery.error instanceof Error ? ordersQuery.error.message : null
      }
      onRefetch={ordersQuery.refetch}
    />
  )
}
