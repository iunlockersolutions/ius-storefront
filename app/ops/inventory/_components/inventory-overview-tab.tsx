"use client"

import Link from "next/link"

import {
  ArrowRight,
  CheckCircle2,
  PackagePlus,
  ShieldAlert,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type {
  AdminInventoryDetail,
  AdminInventoryTrackingMode,
  AdminInventoryTransaction,
  AdminInventoryTransactionType,
} from "@/lib/types/admin-inventory"

import { SerializedUnitsTable } from "./serialized-units-table"

interface InventoryOverviewTabProps {
  detail: AdminInventoryDetail
}

const TRANSACTION_LABELS: Record<AdminInventoryTransactionType, string> = {
  receipt: "Receipt",
  adjustment_increase: "Adjustment +",
  adjustment_decrease: "Adjustment -",
  reservation: "Reservation",
  reservation_release: "Reservation Release",
  allocation: "Allocation",
  allocation_release: "Allocation Release",
  shipment: "Shipment",
  return: "Return",
  damage: "Damage",
  loss: "Loss",
  transfer_out: "Transfer Out",
  transfer_in: "Transfer In",
}

function formatDate(value: string | Date) {
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function getTrackingDescription(
  trackingMode: AdminInventoryTrackingMode,
  variantName: string,
) {
  if (trackingMode === "serial") {
    return `${variantName} is tracked unit by unit, so every physical device can be found by its identifier history.`
  }

  return `${variantName} is tracked by quantity, so your stock counts move in totals instead of individual device records.`
}

function getStockHealthMessage(detail: AdminInventoryDetail) {
  const available = detail.stats.availableQuantity
  const threshold = detail.stats.lowStockThreshold

  if (available <= 0) {
    return "Available stock is fully depleted. Receive more inventory before new demand can be fulfilled."
  }

  if (available <= threshold) {
    return "Available stock is at or below the threshold. Plan the next receipt soon to avoid stockouts."
  }

  return "Available stock is above the threshold, so this variant is in a healthy replenishment range right now."
}

function getMetricDescription(label: string) {
  if (label === "On Hand") {
    return "Every unit currently recorded for this variant."
  }

  if (label === "Available") {
    return "Units that can be sold, reserved, or allocated right now."
  }

  if (label === "Reserved") {
    return "Units committed to demand but not yet allocated to fulfillment."
  }

  if (label === "Allocated") {
    return "Units already assigned into fulfillment work."
  }

  if (label === "Threshold") {
    return "The level where this variant should start raising stock attention."
  }

  if (label === "Serialized Units") {
    return "The total number of individually tracked units on record."
  }

  return "Individually tracked units still available for new work."
}

function renderQuantityGuidance(detail: AdminInventoryDetail) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">
          Quantity Tracking Guidance
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          This variant is managed by counts, so the most important signals are
          how many units are on hand, how many are still available, and how
          close the available quantity is to the threshold.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border bg-background/80 p-5">
          <p className="text-sm font-medium">
            Receive stock to increase supply
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Incoming stock raises on-hand and available quantity together unless
            orders are already reserving inventory.
          </p>
        </div>
        <div className="rounded-2xl border bg-background/80 p-5">
          <p className="text-sm font-medium">
            Reservations show upcoming demand
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Reserved units are still in stock physically, but they should not be
            treated as open supply for new demand.
          </p>
        </div>
        <div className="rounded-2xl border bg-background/80 p-5">
          <p className="text-sm font-medium">Allocated units are in motion</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Once units are allocated, they are already tied to fulfillment work
            and should be reviewed in the transactions history when
            investigating changes.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href={`/ops/inventory/${detail.variantId}?tab=receipts`}>
            <PackagePlus className="mr-2 h-4 w-4" />
            Receive Stock
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/ops/inventory/${detail.variantId}?tab=transactions`}>
            View Transactions
          </Link>
        </Button>
      </div>
    </section>
  )
}

function renderTransactionSummary(transaction: AdminInventoryTransaction) {
  const deltaTone =
    transaction.quantityDelta > 0
      ? "text-emerald-600"
      : transaction.quantityDelta < 0
        ? "text-red-600"
        : "text-foreground"

  return (
    <div
      key={transaction.id}
      className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            {TRANSACTION_LABELS[transaction.type] ??
              transaction.type.replaceAll("_", " ")}
          </Badge>
          <span className={`text-sm font-medium ${deltaTone}`}>
            {transaction.quantityDelta > 0 ? "+" : ""}
            {transaction.quantityDelta}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {transaction.performedByName || "System"} updated this variant on{" "}
          {formatDate(transaction.createdAt)}.
        </p>
        <p className="text-sm leading-6 text-muted-foreground">
          {transaction.notes ||
            "No extra notes were recorded for this stock movement."}
        </p>
      </div>

      <div className="text-sm text-muted-foreground sm:text-right">
        <p>
          On hand {transaction.beforeOnHandQuantity} to{" "}
          {transaction.afterOnHandQuantity}
        </p>
        <p>
          Reserved {transaction.beforeReservedQuantity} to{" "}
          {transaction.afterReservedQuantity}
        </p>
      </div>
    </div>
  )
}

export function InventoryOverviewTab({ detail }: InventoryOverviewTabProps) {
  const metrics = [
    { label: "On Hand", value: detail.stats.onHandQuantity },
    { label: "Available", value: detail.stats.availableQuantity },
    { label: "Reserved", value: detail.stats.reservedQuantity },
    { label: "Allocated", value: detail.stats.allocatedQuantity },
    { label: "Threshold", value: detail.stats.lowStockThreshold },
    ...(detail.trackingMode === "serial"
      ? [
          {
            label: "Serialized Units",
            value: detail.stats.serializedUnitCount,
          },
          { label: "Available Units", value: detail.stats.availableUnitCount },
        ]
      : []),
  ]
  const trackingDescription = getTrackingDescription(
    detail.trackingMode,
    detail.variantName,
  )
  const identifierSummary =
    detail.trackingMode === "serial"
      ? detail.receiptIdentifierTypes
          .map((type) => type.toUpperCase())
          .join(", ")
      : "Quantity only"
  const recentTransactions = detail.transactions.slice(0, 4)

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Inventory Snapshot
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            A clearer view of this variant&apos;s stock position
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            {trackingDescription} Use the sections below to understand current
            stock, the way this variant is tracked, and the latest movement
            history without leaving the overview tab.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-2xl border bg-background/80 p-5"
            >
              <p className="text-sm font-medium">{metric.label}</p>
              <p className="mt-3 text-3xl font-semibold">{metric.value}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {getMetricDescription(metric.label)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            How this inventory works
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            This section explains the tracking rules behind the numbers so staff
            can understand what each quantity means before making stock changes.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="rounded-2xl border bg-background/80 p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
              <div className="space-y-2">
                <p className="font-medium">Tracking setup</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {detail.trackingMode === "serial"
                    ? "Each physical unit is tracked separately. Staff can search the serialized units table by identifier or note to find the right device quickly."
                    : "This variant is managed as a running quantity total. The most important signals are available stock, reserved demand, and the threshold for low stock."}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="capitalize">
                    {detail.trackingMode}
                  </Badge>
                  <Badge variant="secondary">
                    {detail.manageInventory
                      ? "Managed inventory"
                      : "Inventory not managed"}
                  </Badge>
                  <Badge variant="secondary">
                    Receipts: {identifierSummary}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-background/80 p-5">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-600" />
              <div className="space-y-2">
                <p className="font-medium">Stock health</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {getStockHealthMessage(detail)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Threshold {detail.stats.lowStockThreshold} with{" "}
                  {detail.stats.availableQuantity} currently available.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">
              Recent Activity
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              These are the latest stock changes for this variant. Open the full
              transactions tab when you need the complete movement history.
            </p>
          </div>

          <Button variant="outline" asChild>
            <Link href={`/ops/inventory/${detail.variantId}?tab=transactions`}>
              View all transactions
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="rounded-2xl border bg-background/80 p-6 text-sm leading-6 text-muted-foreground">
            No stock changes have been recorded for this variant yet. Once you
            receive, reserve, allocate, or adjust inventory, the latest activity
            will appear here.
          </div>
        ) : (
          <div className="divide-y rounded-2xl border bg-background/80 px-5">
            {recentTransactions.map((transaction) =>
              renderTransactionSummary(transaction),
            )}
          </div>
        )}
      </section>

      <Separator />

      {detail.trackingMode === "serial" ? (
        <SerializedUnitsTable
          variantId={detail.variantId}
          receiptIdentifierTypes={detail.receiptIdentifierTypes}
          totalUnits={detail.stats.serializedUnitCount}
        />
      ) : (
        renderQuantityGuidance(detail)
      )}
    </div>
  )
}
