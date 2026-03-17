import { NextRequest } from "next/server"

import { getReviewStats } from "@/lib/actions/review"
import { requireAdminApiPermission } from "@/lib/auth/admin-api"
import { mapErrorToApi, ok } from "@/lib/utils/api-response"

export async function GET(_request: NextRequest) {
  try {
    await requireAdminApiPermission("review", "read")

    const stats = await getReviewStats()
    return ok(stats)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
