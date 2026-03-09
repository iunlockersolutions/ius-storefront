import { redirect } from "next/navigation"

import { InventoryPageClient } from "@/components/admin/inventory/inventory-page-client"
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <p className="text-muted-foreground">
          Monitor stock levels and manage inventory
        </p>
      </div>

      <InventoryPageClient
        page={page}
        search={search}
        stockStatus={stockStatus}
      />
    </div>
  )
}
