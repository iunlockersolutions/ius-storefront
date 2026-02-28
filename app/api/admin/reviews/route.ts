import { NextRequest } from "next/server"

import { getReviews } from "@/lib/actions/review"
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

function parseRating(value: string | null) {
  if (!value) return undefined
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 5) {
    return undefined
  }
  return parsed
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminApiPermission("review", "list")

    const searchParams = request.nextUrl.searchParams
    const page = parsePositiveNumber(searchParams.get("page"), 1)
    const limit = parsePositiveNumber(searchParams.get("limit"), 20)
    const status = searchParams.get("status") || undefined
    const rating = parseRating(searchParams.get("rating"))
    const search = searchParams.get("search") || undefined

    const result = await getReviews({
      page,
      limit,
      status,
      rating,
      search,
    })

    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
