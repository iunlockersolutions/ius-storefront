import { redirect } from "next/navigation"

import { InventoryStats } from "@/components/admin/inventory/inventory-stats"
import { InventoryTable } from "@/components/admin/inventory/inventory-table"
import { LowStockAlerts } from "@/components/admin/inventory/low-stock-alerts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getInventoryItems,
  getInventoryStats,
  getLowStockAlerts,
} from "@/lib/actions/inventory"
import { requireStaff } from "@/lib/auth/rbac"

interface PageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    status?: string
  }>
}

export default async function InventoryPage({ searchParams }: PageProps) {
  try {
    await requireStaff()
  } catch {
    redirect("/auth/login")
  }

  const params = await searchParams
  const page = Number(params.page) || 1
  const search = params.search || ""
  const stockStatus =
    (params.status as "all" | "low" | "out" | "normal") || "all"

  const [stats, inventory, lowStockAlerts] = await Promise.all([
    getInventoryStats(),
    getInventoryItems({ page, search, stockStatus }),
    getLowStockAlerts(5),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <p className="text-muted-foreground">
          Monitor stock levels and manage inventory
        </p>
      </div>

      <InventoryStats stats={stats} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Stock Levels</CardTitle>
            </CardHeader>
            <CardContent>
              <InventoryTable
                items={inventory.items}
                pagination={inventory.pagination}
                search={search}
                stockStatus={stockStatus}
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <LowStockAlerts alerts={lowStockAlerts} />
        </div>
      </div>
    </div>
  )
}
