"use client"

import {
  CheckCircle,
  Clock,
  CreditCard,
  FileText,
  Package,
  RotateCcw,
  Truck,
  XCircle,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface OrderStatusData {
  status: string
  count: number
}

interface OrderStatusChartProps {
  data: OrderStatusData[]
}

const statusConfig: Record<
  string,
  { label: string; icon: React.ReactNode; color: string }
> = {
  draft: {
    label: "Draft",
    icon: <FileText className="h-4 w-4" />,
    color: "bg-gray-500",
  },
  pending_payment: {
    label: "Pending Payment",
    icon: <CreditCard className="h-4 w-4" />,
    color: "bg-yellow-500",
  },
  paid: {
    label: "Paid",
    icon: <CheckCircle className="h-4 w-4" />,
    color: "bg-green-500",
  },
  processing: {
    label: "Processing",
    icon: <Package className="h-4 w-4" />,
    color: "bg-blue-500",
  },
  shipped: {
    label: "Shipped",
    icon: <Truck className="h-4 w-4" />,
    color: "bg-purple-500",
  },
  delivered: {
    label: "Delivered",
    icon: <CheckCircle className="h-4 w-4" />,
    color: "bg-emerald-500",
  },
  cancelled: {
    label: "Cancelled",
    icon: <XCircle className="h-4 w-4" />,
    color: "bg-red-500",
  },
  refunded: {
    label: "Refunded",
    icon: <RotateCcw className="h-4 w-4" />,
    color: "bg-orange-500",
  },
}

export function OrderStatusChart({ data }: OrderStatusChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0)

  // Sort by predefined order
  const statusOrder = [
    "draft",
    "pending_payment",
    "paid",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ]
  const sortedData = [...data].sort((a, b) => {
    return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Status Distribution</CardTitle>
        <CardDescription>Overview of {total} orders by status</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No order data available
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status breakdown */}
            <div className="grid gap-4 md:grid-cols-2">
              {sortedData.map((status) => {
                const config = statusConfig[status.status] || {
                  label: status.status,
                  icon: <Clock className="h-4 w-4" />,
                  color: "bg-gray-500",
                }
                const percentage = total > 0 ? (status.count / total) * 100 : 0

                return (
                  <div
                    key={status.status}
                    className="flex items-center gap-4 p-3 rounded-lg border"
                  >
                    <div
                      className={`p-2 rounded-lg ${config.color} text-white`}
                    >
                      {config.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{config.label}</span>
                        <span className="text-lg font-bold">
                          {status.count}
                        </span>
                      </div>
                      <div className="mt-1 w-full bg-muted rounded-full h-1.5">
                        <div
                          className={`${config.color} h-1.5 rounded-full`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {percentage.toFixed(1)}% of total
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Summary */}
            <div className="pt-4 border-t">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-500">
                    {data.find((d) => d.status === "delivered")?.count || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Delivered</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-500">
                    {(data.find((d) => d.status === "processing")?.count || 0) +
                      (data.find((d) => d.status === "shipped")?.count || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    In Progress
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-500">
                    {data.find((d) => d.status === "cancelled")?.count || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Cancelled</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
