import Link from "next/link"
import { redirect } from "next/navigation"

import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireStaff } from "@/lib/auth/rbac"

import { MovementHistoryPageClient } from "../../_components/movement-history-page-client"

export const metadata = {
  title: "Inventory History",
  description: "Review inventory transactions for a tracked variant.",
}

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/ops/inventory">
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
          <CardTitle>Inventory Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <MovementHistoryPageClient variantId={id} page={currentPage} />
        </CardContent>
      </Card>
    </div>
  )
}
