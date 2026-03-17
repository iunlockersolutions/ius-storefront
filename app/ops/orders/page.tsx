import { OrdersPageClient } from "./_components/orders-page-client"

export const metadata = {
  title: "Orders | Operations",
  description: "Manage customer orders",
}

interface OrdersPageProps {
  searchParams: Promise<{
    status?: string
    search?: string
    page?: string
  }>
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams
  const status =
    (params.status as
      | "draft"
      | "pending_payment"
      | "paid"
      | "processing"
      | "packing"
      | "shipped"
      | "delivered"
      | "cancelled"
      | "refunded"
      | undefined) || ""
  const search = params.search || ""
  const page = parseInt(params.page || "1", 10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-neutral-500">Manage and track customer orders</p>
      </div>

      <OrdersPageClient page={page} search={search} status={status} />
    </div>
  )
}
