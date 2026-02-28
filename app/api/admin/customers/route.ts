import { NextRequest } from "next/server"

import { getCustomers } from "@/lib/actions/customer"
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
    await requireAdminApiPermission("customer", "list")

    const searchParams = request.nextUrl.searchParams
    const page = parsePositiveNumber(searchParams.get("page"), 1)
    const limit = parsePositiveNumber(searchParams.get("limit"), 20)
    const search = searchParams.get("search") || undefined

    const result = await getCustomers({ page, limit, search })
    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
