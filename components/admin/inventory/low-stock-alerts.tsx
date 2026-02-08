"use client"

import Link from "next/link"

import { AlertTriangle, ArrowRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface LowStockItem {
  id: string
  variantId: string
  quantity: number
  reservedQuantity: number
  lowStockThreshold: number | null
  availableQuantity: number
  isOutOfStock: boolean
  variantName: string
  variantSku: string
  productName: string
  productSlug: string
}

interface LowStockAlertsProps {
  alerts: LowStockItem[]
}

export function LowStockAlerts({ alerts }: LowStockAlertsProps) {
  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Low Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">
            All items are well stocked! 🎉
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          Low Stock Alerts
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/inventory?status=low">
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{item.productName}</p>
              <p className="text-sm text-muted-foreground truncate">
                {item.variantSku}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-2">
              {item.isOutOfStock ? (
                <Badge variant="destructive">0 left</Badge>
              ) : (
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  {item.availableQuantity} left
                </Badge>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
