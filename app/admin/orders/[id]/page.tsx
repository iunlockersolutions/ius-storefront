import { OrderDetailPageClient } from "@/components/admin/orders/order-detail-page-client"

interface OrderDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { id } = await params

  return <OrderDetailPageClient orderId={id} />
}
