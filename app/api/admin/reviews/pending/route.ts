import { NextRequest } from "next/server"

import { getPendingReviews } from "@/lib/actions/review"
import { requireAdminApiPermission } from "@/lib/auth/admin-api"
import { mapErrorToApi, ok } from "@/lib/utils/api-response"

export async function GET(_request: NextRequest) {
  try {
    await requireAdminApiPermission("review", "list")

    const pending = await getPendingReviews()
    return ok(pending)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
