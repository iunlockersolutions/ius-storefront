import { NextRequest } from "next/server"

import { requireAdminApiPermission } from "@/lib/auth/admin-api"
import { serverEnv } from "@/lib/env"
import { releaseExpiredOrderHolds } from "@/lib/orders/hold-expiry"
import { fail, mapErrorToApi, ok } from "@/lib/utils/api-response"

function hasValidCronSecret(request: NextRequest) {
  const expectedSecret =
    serverEnv.ORDER_HOLD_CRON_SECRET ?? serverEnv.CRON_SECRET
  if (!expectedSecret) {
    return false
  }

  const authHeader = request.headers.get("authorization")
  const bearerSecret = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null
  const rawSecret = request.headers.get("x-cron-secret")

  return bearerSecret === expectedSecret || rawSecret === expectedSecret
}

function parseLimit(input: string | null) {
  if (!input) {
    return 100
  }

  const parsed = Number(input)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }

  return Math.min(500, Math.floor(parsed))
}

export async function POST(request: NextRequest) {
  try {
    const limit = parseLimit(request.nextUrl.searchParams.get("limit"))
    if (limit === null) {
      return fail("BAD_REQUEST", "limit must be a positive integer", 400)
    }

    if (!hasValidCronSecret(request)) {
      await requireAdminApiPermission("order", "update")
    }

    const result = await releaseExpiredOrderHolds(limit)
    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
