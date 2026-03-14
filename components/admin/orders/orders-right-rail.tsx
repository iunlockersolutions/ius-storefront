"use client"

import Link from "next/link"

import { AlertTriangle, ArrowRight, Clock3, Truck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import type { AdminOrderListItem } from "@/lib/types/admin-order"
import { cn, formatCurrency, formatDate } from "@/lib/utils"

interface OrdersRightRailProps {
  latestOrders: AdminOrderListItem[]
  attentionOrders: AdminOrderListItem[]
  onNavigate?: () => void
}

function getAttentionLabel(
  state: AdminOrderListItem["progress"]["attentionState"],
) {
  switch (state) {
    case "needs_payment_review":
      return "Needs payment review"
    case "awaiting_processing":
      return "Awaiting processing"
    case "needs_serial_assignment":
      return "Needs serial assignment"
    case "ready_to_ship":
      return "Ready to ship"
    case "exception":
      return "Exception"
    default:
      return "Active"
  }
}

function getAttentionClass(
  state: AdminOrderListItem["progress"]["attentionState"],
) {
  switch (state) {
    case "needs_payment_review":
      return "border-amber-200 bg-amber-50 text-amber-900"
    case "needs_serial_assignment":
      return "border-rose-200 bg-rose-50 text-rose-900"
    case "ready_to_ship":
      return "border-emerald-200 bg-emerald-50 text-emerald-900"
    case "awaiting_processing":
      return "border-sky-200 bg-sky-50 text-sky-900"
    case "exception":
      return "border-red-200 bg-red-50 text-red-900"
    default:
      return "border-border/80 bg-background text-foreground"
  }
}

function OrderQueueItem({
  order,
  onNavigate,
}: {
  order: AdminOrderListItem
  onNavigate?: () => void
}) {
  return (
    <Link
      href={`/ops/orders/${order.id}`}
      onClick={onNavigate}
      className="block rounded-xl border border-border/70 bg-background/95 p-3 shadow-xs transition-colors hover:bg-muted/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">
            {order.orderNumber}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {order.customerName || order.customerEmail}
          </p>
        </div>
        <Badge variant="outline" className="shrink-0">
          {formatCurrency(order.total)}
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline" className="capitalize">
          {order.paymentStatus.replaceAll("_", " ")}
        </Badge>
        <Badge variant="outline" className="capitalize">
          {order.fulfillmentStatus.replaceAll("_", " ")}
        </Badge>
        {order.latestTrackingNumber ? (
          <span className="inline-flex items-center gap-1">
            <Truck className="h-3 w-3" />
            {order.latestTrackingNumber}
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {formatDate(order.latestActivityAt, { dateStyle: "medium" })}
        </span>
        <span>
          {order.progress.readyLines}/{order.progress.totalLines} lines ready
        </span>
      </div>
    </Link>
  )
}

function AttentionItem({
  order,
  onNavigate,
}: {
  order: AdminOrderListItem
  onNavigate?: () => void
}) {
  const state = order.progress.attentionState

  return (
    <Link
      href={`/ops/orders/${order.id}`}
      onClick={onNavigate}
      className={cn(
        "block rounded-xl border p-3 shadow-xs transition-colors hover:opacity-90",
        getAttentionClass(state),
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{order.orderNumber}</p>
          <p className="mt-1 truncate text-xs opacity-80">
            {order.customerName || order.customerEmail}
          </p>
        </div>
        <Badge variant="outline" className="bg-background/80">
          {getAttentionLabel(state)}
        </Badge>
      </div>
      <p className="mt-3 text-xs opacity-80">
        {order.progress.serialLines > 0
          ? `${order.progress.serialAssignedUnits}/${order.progress.serialRequiredUnits} serialized units assigned`
          : `${order.progress.allocatedQuantityUnits}/${order.progress.committedQuantityUnits} quantity units prepared`}
      </p>
    </Link>
  )
}

export function OrdersRightRail({
  latestOrders,
  attentionOrders,
  onNavigate,
}: OrdersRightRailProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-4 border-b border-border/70 px-6 py-5">
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Order Queue</h2>
        </div>
        <p className="max-w-[18rem] text-sm text-muted-foreground">
          Keep the newest orders moving and clear the blocked ones first.
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link
              href="/ops/orders?sortBy=latestActivityAt"
              onClick={onNavigate}
            >
              View latest
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Badge variant="outline">{attentionOrders.length} attention</Badge>
        </div>
      </div>

      <ScrollArea className="h-full">
        <div className="space-y-5 px-4 py-5">
          <section className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Needs Attention</h3>
            </div>
            {attentionOrders.length > 0 ? (
              attentionOrders.map((order) => (
                <AttentionItem
                  key={order.id}
                  order={order}
                  onNavigate={onNavigate}
                />
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                No blocked orders right now.
              </div>
            )}
          </section>

          <Separator />

          <section className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Clock3 className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Latest Orders</h3>
            </div>
            {latestOrders.length > 0 ? (
              latestOrders.map((order) => (
                <OrderQueueItem
                  key={order.id}
                  order={order}
                  onNavigate={onNavigate}
                />
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                Latest order activity will appear here.
              </div>
            )}
          </section>
        </div>
      </ScrollArea>
    </div>
  )
}
