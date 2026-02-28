"use client"

import { OrdersTable } from "@/components/admin/orders/orders-table"
import { useAdminOrdersQuery } from "@/hooks/admin/use-admin-orders-query"

type OrderStatus =
  | "draft"
  | "pending_payment"
  | "paid"
  | "processing"
  | "packing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"

interface OrdersPageClientProps {
  page: number
  search: string
  status: OrderStatus | ""
}

export function OrdersPageClient({
  page,
  search,
  status,
}: OrdersPageClientProps) {
  const ordersQuery = useAdminOrdersQuery({
    page,
    limit: 20,
    search: search || undefined,
    status: status || undefined,
  })

  return (
    <OrdersTable
      orders={ordersQuery.data?.orders ?? []}
      total={ordersQuery.data?.pagination.total ?? 0}
      page={ordersQuery.data?.pagination.page ?? page}
      totalPages={ordersQuery.data?.pagination.totalPages ?? 0}
      search={search}
      status={status}
      isLoading={ordersQuery.isLoading || ordersQuery.isFetching}
      errorMessage={
        ordersQuery.error instanceof Error ? ordersQuery.error.message : null
      }
      onRefetch={ordersQuery.refetch}
    />
  )
}
