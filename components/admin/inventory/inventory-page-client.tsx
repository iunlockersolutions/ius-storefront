"use client"

import { InventoryStats } from "@/components/admin/inventory/inventory-stats"
import { InventoryTable } from "@/components/admin/inventory/inventory-table"
import { LowStockAlerts } from "@/components/admin/inventory/low-stock-alerts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAdminInventoryQuery } from "@/hooks/admin/use-admin-inventory-query"

interface InventoryPageClientProps {
  page: number
  search: string
  stockStatus: "all" | "low" | "out" | "normal"
}

export function InventoryPageClient({
  page,
  search,
  stockStatus,
}: InventoryPageClientProps) {
  const inventoryQuery = useAdminInventoryQuery({
    page,
    limit: 20,
    search,
    status: stockStatus,
  })

  return (
    <>
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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Stock Levels</CardTitle>
            </CardHeader>
            <CardContent>
              <InventoryTable
                key={`${search}:${stockStatus}:${page}`}
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
                isLoading={
                  inventoryQuery.isLoading || inventoryQuery.isFetching
                }
                errorMessage={
                  inventoryQuery.error instanceof Error
                    ? inventoryQuery.error.message
                    : null
                }
                onRefetch={inventoryQuery.refetch}
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <LowStockAlerts alerts={inventoryQuery.data?.lowStockAlerts ?? []} />
        </div>
      </div>
    </>
  )
}
