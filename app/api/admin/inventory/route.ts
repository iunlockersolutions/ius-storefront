import { NextRequest } from "next/server"

import {
  getInventoryItems,
  getInventoryStats,
  getLowStockAlerts,
} from "@/lib/actions/inventory"
import { requireAdminApiPermission } from "@/lib/auth/admin-api"
import type {
  AdminInventorySortField,
  AdminInventorySortOrder,
  AdminInventoryStatus,
} from "@/lib/types/admin-inventory"
import { mapErrorToApi, ok } from "@/lib/utils/api-response"

function parsePositiveNumber(value: string | null, fallback: number) {
  if (!value) return fallback

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }

  return parsed
}

function parseStockStatus(value: string | null) {
  if (
    value === "all" ||
    value === "low" ||
    value === "out" ||
    value === "normal"
  ) {
    return value
  }

  return "all" as AdminInventoryStatus
}

function parseSortField(value: string | null) {
  if (
    value === "product" ||
    value === "sku" ||
    value === "available" ||
    value === "reserved" ||
    value === "allocated" ||
    value === "onHand" ||
    value === "status" ||
    value === "updated"
  ) {
    return value
  }

  return "updated" as AdminInventorySortField
}

function parseSortOrder(value: string | null) {
  if (value === "asc" || value === "desc") {
    return value
  }

  return "desc" as AdminInventorySortOrder
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminApiPermission("inventory", "list")

    const searchParams = request.nextUrl.searchParams
    const page = parsePositiveNumber(searchParams.get("page"), 1)
    const limit = parsePositiveNumber(searchParams.get("limit"), 20)
    const search = searchParams.get("search") || ""
    const stockStatus = parseStockStatus(searchParams.get("status"))
    const sortBy = parseSortField(searchParams.get("sortBy"))
    const sortOrder = parseSortOrder(searchParams.get("sortOrder"))

    const [stats, inventory, lowStockAlerts] = await Promise.all([
      getInventoryStats(),
      getInventoryItems({
        page,
        limit,
        search,
        stockStatus,
        sortBy,
        sortOrder,
      }),
      getLowStockAlerts(5),
    ])

    return ok({ stats, inventory, lowStockAlerts })
  } catch (error) {
    return mapErrorToApi(error)
  }
}
