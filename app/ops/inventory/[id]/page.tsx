import { redirect } from "next/navigation"

import { InventoryDetailPageClient } from "@/components/admin/inventory/inventory-detail-page-client"
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

  return <InventoryDetailPageClient variantId={id} initialTab={initialTab} />
}
