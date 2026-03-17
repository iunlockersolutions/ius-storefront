"use client"

import Link from "next/link"

import { AlertTriangle, ArrowRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { AdminInventoryLowStockAlert } from "@/lib/types/admin-inventory"

interface LowStockAlertsContentProps {
  alerts: AdminInventoryLowStockAlert[]
  onNavigate?: () => void
}

function AlertStateBadge({
  availableQuantity,
  isOutOfStock,
}: Pick<AdminInventoryLowStockAlert, "availableQuantity" | "isOutOfStock">) {
  if (isOutOfStock) {
    return <Badge variant="destructive">Out of stock</Badge>
  }

  return (
    <Badge variant="outline" className="border-border/80 bg-background">
      {availableQuantity} left
    </Badge>
  )
}

function AlertList({ alerts, onNavigate }: LowStockAlertsContentProps) {
  if (alerts.length === 0) {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/20 px-6 py-10 text-center">
        <AlertTriangle className="h-5 w-5 text-muted-foreground" />
        <p className="mt-3 font-medium text-foreground">
          No low-stock alerts right now
        </p>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          All tracked variants are currently above their configured threshold.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {alerts.map((item) => (
        <div
          key={item.variantId}
          className="rounded-xl border border-border/70 bg-background/95 p-3 shadow-xs"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">
                {item.productName}
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {item.variantName} â€¢ {item.variantSku}
              </p>
            </div>
            <AlertStateBadge
              availableQuantity={item.availableQuantity}
              isOutOfStock={item.isOutOfStock}
            />
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="capitalize">
              {item.trackingMode}
            </Badge>
            <span>Threshold {item.lowStockThreshold}</span>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Review stock movement and threshold details.
            </p>
            <Button variant="ghost" size="xs" asChild>
              <Link
                href={`/ops/inventory/${item.variantId}`}
                onClick={onNavigate}
              >
                Open
              </Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

export function LowStockAlertRailContent({
  alerts,
  onNavigate,
}: LowStockAlertsContentProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-4 border-b border-border/70 px-6 py-5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">
            Low Stock Alerts
          </h2>
          <Badge variant="outline">{alerts.length}</Badge>
        </div>
        <div className="space-y-3">
          <p className="max-w-[18rem] text-sm text-muted-foreground">
            Keep watch on variants nearing or below threshold.
          </p>
          <div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/ops/inventory?status=low" onClick={onNavigate}>
                View low stock
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <ScrollArea className="h-full">
          <div className="px-3 py-5">
            <AlertList alerts={alerts} onNavigate={onNavigate} />
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

export function LowStockAlertsMobileContent({
  alerts,
  onNavigate,
}: LowStockAlertsContentProps) {
  return (
    <ScrollArea className="h-full">
      <div className="px-5 py-5">
        <AlertList alerts={alerts} onNavigate={onNavigate} />
      </div>
    </ScrollArea>
  )
}

export function LowStockAlertsSummary({
  alerts,
  onOpenAlerts,
}: {
  alerts: AdminInventoryLowStockAlert[]
  onOpenAlerts?: () => void
}) {
  const outOfStockCount = alerts.filter((item) => item.isOutOfStock).length

  return (
    <Card size="sm" className="border-border/70">
      <CardHeader className="border-b border-border/70">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          Low Stock Alerts
        </CardTitle>
        <CardDescription>
          {alerts.length === 0
            ? "All tracked variants are above threshold."
            : `${alerts.length} variants need review${
                outOfStockCount > 0
                  ? `, ${outOfStockCount} are out of stock`
                  : ""
              }.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3 pt-4">
        <Badge variant="outline">{alerts.length} active</Badge>
        {onOpenAlerts ? (
          <Button variant="outline" size="sm" onClick={onOpenAlerts}>
            Open alerts
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" asChild>
            <Link href="/ops/inventory?status=low">
              View list
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
