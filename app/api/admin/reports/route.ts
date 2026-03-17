import { NextRequest } from "next/server"

import {
  getCustomerStats,
  getOrderStatusDistribution,
  getPaymentMethodStats,
  getSalesByDay,
  getSalesOverview,
  getTopProducts,
} from "@/lib/actions/reports"
import { requireAdminApiPermission } from "@/lib/auth/admin-api"
import { mapErrorToApi, ok } from "@/lib/utils/api-response"

function parsePositiveNumber(value: string | null, fallback: number) {
  if (!value) return fallback

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }

  return parsed
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminApiPermission("reports", "read")

    const searchParams = request.nextUrl.searchParams
    const days = parsePositiveNumber(searchParams.get("days"), 30)
    const topProductsLimit = parsePositiveNumber(
      searchParams.get("topProductsLimit"),
      10,
    )

    const [
      salesOverview,
      salesByDay,
      topProducts,
      paymentMethodStats,
      customerStats,
      orderStatusDistribution,
    ] = await Promise.all([
      getSalesOverview(),
      getSalesByDay(days),
      getTopProducts(topProductsLimit),
      getPaymentMethodStats(),
      getCustomerStats(),
      getOrderStatusDistribution(),
    ])

    return ok({
      salesOverview,
      salesByDay,
      topProducts,
      paymentMethodStats,
      customerStats,
      orderStatusDistribution,
    })
  } catch (error) {
    return mapErrorToApi(error)
  }
}
