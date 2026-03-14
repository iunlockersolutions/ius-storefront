import { NextRequest } from "next/server"

import { getInventoryUnits } from "@/lib/actions/inventory"
import { requireAdminApiPermission } from "@/lib/auth/admin-api"
import {
  type AdminInventorySortOrder,
  type AdminInventoryUnitIdentifierFilter,
  type AdminInventoryUnitSortField,
  type AdminInventoryUnitStatus,
} from "@/lib/types/admin-inventory"
import { mapErrorToApi, ok } from "@/lib/utils/api-response"

interface RouteProps {
  params: Promise<{ id: string }>
}

function parsePositiveNumber(value: string | null, fallback: number) {
  if (!value) return fallback

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }

  return parsed
}

function parseStatus(value: string | null): AdminInventoryUnitStatus | "all" {
  if (
    value === "received" ||
    value === "available" ||
    value === "reserved" ||
    value === "allocated" ||
    value === "packed" ||
    value === "shipped" ||
    value === "returned" ||
    value === "damaged" ||
    value === "lost"
  ) {
    return value
  }

  return "all"
}

function parseIdentifierType(
  value: string | null,
): AdminInventoryUnitIdentifierFilter {
  if (
    value === "serial" ||
    value === "imei" ||
    value === "imei2" ||
    value === "barcode"
  ) {
    return value
  }

  return "all"
}

function parseSortField(value: string | null): AdminInventoryUnitSortField {
  if (
    value === "identifier" ||
    value === "status" ||
    value === "received" ||
    value === "updated"
  ) {
    return value
  }

  return "updated"
}

function parseSortOrder(value: string | null): AdminInventorySortOrder {
  return value === "asc" ? "asc" : "desc"
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("inventory", "read")

    const { id } = await params
    const searchParams = request.nextUrl.searchParams

    const result = await getInventoryUnits({
      variantId: id,
      page: parsePositiveNumber(searchParams.get("page"), 1),
      limit: parsePositiveNumber(searchParams.get("limit"), 10),
      search: searchParams.get("search") ?? "",
      status: parseStatus(searchParams.get("status")),
      identifierType: parseIdentifierType(searchParams.get("identifierType")),
      sortBy: parseSortField(searchParams.get("sortBy")),
      sortOrder: parseSortOrder(searchParams.get("sortOrder")),
    })

    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
