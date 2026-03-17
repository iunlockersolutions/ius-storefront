import { NextRequest } from "next/server"

import { getOrders } from "@/lib/actions/order"
import { requireAdminApiPermission } from "@/lib/auth/admin-api"
import {
  fail,
  failFromMessage,
  mapErrorToApi,
  ok,
} from "@/lib/utils/api-response"

function parsePositiveNumber(value: string | null, fallback: number) {
  if (!value) return fallback

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }

  return parsed
}

function parseOrderStatus(value: string | null) {
  if (
    value === "draft" ||
    value === "pending_payment" ||
    value === "paid" ||
    value === "processing" ||
    value === "packing" ||
    value === "shipped" ||
    value === "delivered" ||
    value === "cancelled" ||
    value === "refunded"
  ) {
    return value
  }

  return undefined
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminApiPermission("order", "list")

    const searchParams = request.nextUrl.searchParams

    const page = parsePositiveNumber(searchParams.get("page"), 1)
    const limit = parsePositiveNumber(searchParams.get("limit"), 20)
    const search = searchParams.get("search") || undefined
    const status = parseOrderStatus(searchParams.get("status"))

    const result = await getOrders({
      page,
      limit,
      search,
      status,
    })

    if (!result.success || !result.data) {
      return failFromMessage(
        result.error || "Failed to fetch orders",
        "BAD_REQUEST",
      )
    }

    return ok(result.data)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
