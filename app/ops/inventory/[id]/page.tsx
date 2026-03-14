import { Suspense } from "react"
import { redirect } from "next/navigation"

import { InventoryDetailPageClient } from "@/components/admin/inventory/inventory-detail-page-client"
import { AdminQueryLoadingState } from "@/components/admin/query-state"
import { requireStaff } from "@/lib/auth/rbac"

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function InventoryDetailPage({
  params,
  searchParams,
}: PageProps) {
  try {
    await requireStaff()
  } catch {
    redirect("/auth/login")
  }

  const { id } = await params
  const { tab } = await searchParams
  const initialTab =
    tab === "receipts" || tab === "transactions" ? tab : "overview"

  return (
    <Suspense
      fallback={<AdminQueryLoadingState skeletonClassName="h-[34rem] w-full" />}
    >
      <InventoryDetailPageClient variantId={id} initialTab={initialTab} />
    </Suspense>
  )
}
