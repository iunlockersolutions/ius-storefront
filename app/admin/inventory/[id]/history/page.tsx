import Link from "next/link"
import { redirect } from "next/navigation"

import { ArrowLeft } from "lucide-react"

import { MovementHistory } from "@/components/admin/inventory/movement-history"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getInventoryMovements } from "@/lib/actions/inventory"
import { requireStaff } from "@/lib/auth/rbac"

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function InventoryHistoryPage({
  params,
  searchParams,
}: PageProps) {
  try {
    await requireStaff()
  } catch {
    redirect("/auth/login")
  }

  const { id } = await params
  const { page } = await searchParams
  const currentPage = Number(page) || 1

  const movements = await getInventoryMovements({
    inventoryItemId: id,
    page: currentPage,
    limit: 20,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/inventory">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Movement History</h1>
          <p className="text-muted-foreground">
            View all stock movements for this item
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Movements</CardTitle>
        </CardHeader>
        <CardContent>
          <MovementHistory
            movements={movements.movements}
            pagination={movements.pagination}
          />
        </CardContent>
      </Card>
    </div>
  )
}
