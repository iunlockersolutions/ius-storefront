import { Suspense } from "react"

import { OrdersTable } from "@/components/admin/orders/orders-table"
import { Skeleton } from "@/components/ui/skeleton"
import { getOrders } from "@/lib/actions/order"

export const metadata = {
  title: "Orders | Admin Dashboard",
  description: "Manage customer orders",
}

interface OrdersPageProps {
  searchParams: Promise<{
    status?: string
    search?: string
    page?: string
  }>
}

async function OrdersData({
  searchParams,
}: {
  searchParams: OrdersPageProps["searchParams"]
}) {
  const params = await searchParams
  const status = params.status as
    | "draft"
    | "pending_payment"
    | "paid"
    | "processing"
    | "packing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "refunded"
    | undefined
  const search = params.search || ""
  const page = parseInt(params.page || "1", 10)

  const result = await getOrders({
    status,
    search,
    page,
    limit: 20,
  })

  if (!result.success || !result.data) {
    return <div className="text-red-500">Failed to load orders</div>
  }

  return (
    <OrdersTable
      orders={result.data.orders}
      total={result.data.pagination.total}
      page={result.data.pagination.page}
      totalPages={result.data.pagination.totalPages}
      search={search}
      status={status || ""}
    />
  )
}

export default function OrdersPage({ searchParams }: OrdersPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-neutral-500">Manage and track customer orders</p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-40" />
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        }
      >
        <OrdersData searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
