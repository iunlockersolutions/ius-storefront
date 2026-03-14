"use client"

import { useEffect, useMemo } from "react"

import { useOpsRightRail } from "@/app/ops/_components/ops-right-rail-provider"
import { InventoryStats } from "@/components/admin/inventory/inventory-stats"
import { InventoryTable } from "@/components/admin/inventory/inventory-table"
import {
  LowStockAlertRailContent,
  LowStockAlertsMobileContent,
  LowStockAlertsSummary,
} from "@/components/admin/inventory/low-stock-alerts"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useAdminInventoryQuery } from "@/hooks/admin/use-admin-inventory-query"
import type {
  AdminInventorySortField,
  AdminInventorySortOrder,
} from "@/lib/types/admin-inventory"

interface InventoryPageClientProps {
  page: number
  search: string
  stockStatus: "all" | "low" | "out" | "normal"
  sortBy: AdminInventorySortField
  sortOrder: AdminInventorySortOrder
}

export function InventoryPageClient({
  page,
  search,
  stockStatus,
  sortBy,
  sortOrder,
}: InventoryPageClientProps) {
  const { clearRail, closeMobileRail, openMobileRail, setRail } =
    useOpsRightRail()
  const inventoryQuery = useAdminInventoryQuery({
    page,
    limit: 20,
    search,
    status: stockStatus,
    sortBy,
    sortOrder,
  })
  const alerts = useMemo(
    () => inventoryQuery.data?.lowStockAlerts ?? [],
    [inventoryQuery.data?.lowStockAlerts],
  )

  useEffect(() => {
    setRail({
      isVisible: true,
      desktopContent: <LowStockAlertRailContent alerts={alerts} />,
      mobileContent: (
        <LowStockAlertsMobileContent
          alerts={alerts}
          onNavigate={closeMobileRail}
        />
      ),
      desktopWidth: "22rem",
      mobileTitle: "Low Stock Alerts",
      mobileDescription: "Review the variants that need stock attention.",
    })

    return clearRail
  }, [alerts, clearRail, closeMobileRail, setRail])

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <p className="text-muted-foreground">
          Monitor stock levels and manage inventory
        </p>
      </div>

      <InventoryStats
        stats={
          inventoryQuery.data?.stats ?? {
            totalTrackedVariants: 0,
            quantityTrackedVariants: 0,
            serialTrackedVariants: 0,
            lowStockVariants: 0,
            outOfStockVariants: 0,
            totalOnHand: 0,
            totalAvailable: 0,
            totalReserved: 0,
            totalAllocated: 0,
          }
        }
      />

      <div className="xl:hidden">
        <LowStockAlertsSummary alerts={alerts} onOpenAlerts={openMobileRail} />
      </div>

      <Separator />

      <section className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">
              Stock Levels
            </h2>
            <p className="text-sm text-muted-foreground">
              Search tracked variants, review stock health, and jump into
              adjustments or receipts.
            </p>
          </div>
          <Button
            variant="outline"
            className="xl:hidden"
            onClick={openMobileRail}
          >
            Low Stock Alerts ({alerts.length})
          </Button>
        </div>

        <InventoryTable
          key={`${search}:${stockStatus}:${sortBy}:${sortOrder}:${page}`}
          items={inventoryQuery.data?.inventory.items ?? []}
          pagination={
            inventoryQuery.data?.inventory.pagination ?? {
              page,
              limit: 20,
              total: 0,
              totalPages: 0,
            }
          }
          search={search}
          stockStatus={stockStatus}
          sortBy={sortBy}
          sortOrder={sortOrder}
          isLoading={inventoryQuery.isLoading || inventoryQuery.isFetching}
          errorMessage={
            inventoryQuery.error instanceof Error
              ? inventoryQuery.error.message
              : null
          }
          onRefetch={inventoryQuery.refetch}
        />
      </section>
    </div>
  )
}
