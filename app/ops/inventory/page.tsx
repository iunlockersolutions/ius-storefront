import { redirect } from "next/navigation"

import { requireStaff } from "@/lib/auth/rbac"
import type {
  AdminInventorySortField,
  AdminInventorySortOrder,
} from "@/lib/types/admin-inventory"

import { InventoryPageClient } from "./_components/inventory-page-client"

interface PageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    status?: string
    sortBy?: string
    sortOrder?: string
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
  const sortBy =
    (params.sortBy as AdminInventorySortField | undefined) || "updated"
  const sortOrder =
    (params.sortOrder as AdminInventorySortOrder | undefined) || "desc"

  return (
    <InventoryPageClient
      page={page}
      search={search}
      stockStatus={stockStatus}
      sortBy={sortBy}
      sortOrder={sortOrder}
    />
  )
}
