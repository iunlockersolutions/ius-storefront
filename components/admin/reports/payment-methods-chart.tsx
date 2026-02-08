"use client"

import { Building2, CreditCard, Truck } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface PaymentMethod {
  method: string
  count: number
  total: number
}

interface PaymentMethodsChartProps {
  data: PaymentMethod[]
}

const methodConfig: Record<
  string,
  { label: string; icon: React.ReactNode; color: string }
> = {
  card: {
    label: "Card",
    icon: <CreditCard className="h-4 w-4" />,
    color: "bg-blue-500",
  },
  bank_transfer: {
    label: "Bank Transfer",
    icon: <Building2 className="h-4 w-4" />,
    color: "bg-green-500",
  },
  cash_on_delivery: {
    label: "Cash on Delivery",
    icon: <Truck className="h-4 w-4" />,
    color: "bg-yellow-500",
  },
}

export function PaymentMethodsChart({ data }: PaymentMethodsChartProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const total = data.reduce((sum, d) => sum + d.total, 0)
  const totalCount = data.reduce((sum, d) => sum + d.count, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
        <CardDescription>
          Distribution of {totalCount} completed payments
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No payment data available
          </div>
        ) : (
          <div className="space-y-6">
            {/* Progress bars */}
            <div className="space-y-4">
              {data.map((method) => {
                const config = methodConfig[method.method] || {
                  label: method.method,
                  icon: <CreditCard className="h-4 w-4" />,
                  color: "bg-gray-500",
                }
                const percentage = total > 0 ? (method.total / total) * 100 : 0

                return (
                  <div key={method.method} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className={`p-1.5 rounded ${config.color} text-white`}
                        >
                          {config.icon}
                        </span>
                        <span className="font-medium">{config.label}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(method.total)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {method.count} payments ({percentage.toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`${config.color} h-2 rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Total */}
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total</span>
                <span className="text-xl font-bold">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
