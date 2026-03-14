import { OrdersPageClient } from "@/components/admin/orders/orders-page-client"
import { requireStaff } from "@/lib/auth/rbac"
import type {
  AdminOrderFulfillmentStatus,
  AdminOrderListView,
  AdminOrderPaymentStatus,
  AdminOrderStatus,
} from "@/lib/types/admin-order"

export const metadata = {
  title: "Orders | Operations",
  description: "Manage customer orders",
}

interface OrdersPageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    status?: string
    paymentStatus?: string
    fulfillmentStatus?: string
    customerType?: string
    shippingMethod?: string
    view?: string
    sortBy?: string
    sortOrder?: string
  }>
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  await requireStaff()

  const params = await searchParams
  const page = parseInt(params.page || "1", 10)
  const search = params.search || ""
  const status = (params.status as AdminOrderStatus | undefined) || ""
  const paymentStatus =
    (params.paymentStatus as AdminOrderPaymentStatus | undefined) || ""
  const fulfillmentStatus =
    (params.fulfillmentStatus as AdminOrderFulfillmentStatus | undefined) || ""
  const customerType =
    (params.customerType as "all" | "guest" | "registered" | undefined) || "all"
  const shippingMethod = params.shippingMethod || ""
  const view = (params.view as AdminOrderListView | undefined) || "all"
  const sortBy =
    (params.sortBy as
      | "createdAt"
      | "updatedAt"
      | "latestActivityAt"
      | "total"
      | "customer"
      | "paymentStatus"
      | "fulfillmentStatus"
      | "orderNumber"
      | undefined) || "createdAt"
  const sortOrder = (params.sortOrder as "asc" | "desc" | undefined) || "desc"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-neutral-500">Manage and track customer orders</p>
      </div>

      <OrdersPageClient
        page={page}
        search={search}
        status={status}
        paymentStatus={paymentStatus}
        fulfillmentStatus={fulfillmentStatus}
        customerType={customerType}
        shippingMethod={shippingMethod}
        view={view}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />
    </div>
  )
}
