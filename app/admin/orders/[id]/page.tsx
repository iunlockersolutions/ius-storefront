import Link from "next/link"
import { notFound } from "next/navigation"

import { ChevronLeft } from "lucide-react"

import { OrderDetail } from "@/components/admin/orders/order-detail"
import { Button } from "@/components/ui/button"
import { getOrder } from "@/lib/actions/order"

interface OrderDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { id } = await params
  const result = await getOrder(id)

  if (!result.success || !result.data) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/orders">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            Order {result.data.orderNumber}
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage order details and status
          </p>
        </div>
      </div>

      <OrderDetail order={result.data} />
    </div>
  )
}
