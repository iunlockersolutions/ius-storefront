"use client"

import { format, parseISO } from "date-fns"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface SalesChartProps {
  data: {
    date: string
    orders: number
    revenue: number
  }[]
}

export function SalesChart({ data }: SalesChartProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1)
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0)
  const totalOrders = data.reduce((sum, d) => sum + d.orders, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Trend</CardTitle>
        <CardDescription>
          Last 30 days: {formatCurrency(totalRevenue)} from {totalOrders} orders
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No sales data available
          </div>
        ) : (
          <div className="space-y-4">
            {/* Simple bar chart using CSS */}
            <div className="flex items-end gap-1 h-48">
              {data.map((day, index) => {
                const height = (day.revenue / maxRevenue) * 100
                return (
                  <div key={index} className="flex-1 group relative">
                    <div
                      className="bg-primary/80 hover:bg-primary rounded-t transition-colors cursor-pointer"
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                      <div className="bg-popover text-popover-foreground text-xs rounded p-2 shadow-lg border whitespace-nowrap">
                        <div className="font-medium">
                          {format(parseISO(day.date), "MMM d")}
                        </div>
                        <div>{formatCurrency(day.revenue)}</div>
                        <div className="text-muted-foreground">
                          {day.orders} orders
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* X-axis labels */}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {data.length > 0 && format(parseISO(data[0].date), "MMM d")}
              </span>
              <span>
                {data.length > 0 &&
                  format(parseISO(data[data.length - 1].date), "MMM d")}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
