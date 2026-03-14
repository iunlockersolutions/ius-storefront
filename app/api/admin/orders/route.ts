import { NextRequest } from "next/server"

import { getOrders } from "@/lib/actions/order"
import { requireAdminApiPermission } from "@/lib/auth/admin-api"
import type {
  AdminOrderFulfillmentStatus,
  AdminOrderListView,
  AdminOrderPaymentStatus,
} from "@/lib/types/admin-order"
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

function parsePaymentStatus(
  value: string | null,
): AdminOrderPaymentStatus | undefined {
  if (
    value === "unpaid" ||
    value === "pending_verification" ||
    value === "authorized" ||
    value === "paid" ||
    value === "failed" ||
    value === "refunded" ||
    value === "cancelled"
  ) {
    return value
  }

  return undefined
}

function parseFulfillmentStatus(
  value: string | null,
): AdminOrderFulfillmentStatus | undefined {
  if (
    value === "confirmed" ||
    value === "processing" ||
    value === "packing" ||
    value === "shipped" ||
    value === "delivered" ||
    value === "cancelled"
  ) {
    return value
  }

  return undefined
}

function parseCustomerType(value: string | null) {
  if (value === "all" || value === "guest" || value === "registered") {
    return value
  }

  return undefined
}

function parseView(value: string | null): AdminOrderListView | undefined {
  if (
    value === "all" ||
    value === "needs_payment_review" ||
    value === "awaiting_processing" ||
    value === "needs_serial_assignment" ||
    value === "ready_to_ship" ||
    value === "delivered" ||
    value === "exceptions"
  ) {
    return value
  }

  return undefined
}

function parseSortBy(value: string | null) {
  if (
    value === "createdAt" ||
    value === "updatedAt" ||
    value === "latestActivityAt" ||
    value === "total" ||
    value === "customer" ||
    value === "paymentStatus" ||
    value === "fulfillmentStatus" ||
    value === "orderNumber"
  ) {
    return value
  }

  return undefined
}

function parseSortOrder(value: string | null) {
  if (value === "asc" || value === "desc") {
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
    const paymentStatus = parsePaymentStatus(searchParams.get("paymentStatus"))
    const fulfillmentStatus = parseFulfillmentStatus(
      searchParams.get("fulfillmentStatus"),
    )
    const customerType =
      parseCustomerType(searchParams.get("customerType")) ?? "all"
    const shippingMethod = searchParams.get("shippingMethod") || undefined
    const view = parseView(searchParams.get("view")) ?? "all"
    const sortBy = parseSortBy(searchParams.get("sortBy")) ?? "createdAt"
    const sortOrder = parseSortOrder(searchParams.get("sortOrder")) ?? "desc"

    const result = await getOrders({
      page,
      limit,
      search,
      status,
      paymentStatus,
      fulfillmentStatus,
      customerType,
      shippingMethod,
      view,
      sortBy,
      sortOrder,
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
