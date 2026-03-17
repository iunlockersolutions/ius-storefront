import { NextRequest } from "next/server"

import { getPayments } from "@/lib/actions/payment"
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
    await requireAdminApiPermission("payment", "list")

    const searchParams = request.nextUrl.searchParams
    const page = parsePositiveNumber(searchParams.get("page"), 1)
    const limit = parsePositiveNumber(searchParams.get("limit"), 20)
    const status = searchParams.get("status") || undefined
    const method = searchParams.get("method") || undefined
    const search = searchParams.get("search") || undefined

    const result = await getPayments({
      page,
      limit,
      status,
      method,
      search,
    })

    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
