import { NextRequest } from "next/server"

import { bulkModerateReviews } from "@/lib/actions/review"
import {
  auditAdminMutation,
  requireAdminApiPermission,
} from "@/lib/auth/admin-api"
import {
  fail,
  failFromMessage,
  mapErrorToApi,
  ok,
} from "@/lib/utils/api-response"

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      reviewIds?: string[]
      action?: "approve" | "reject"
    }

    if (!Array.isArray(body.reviewIds) || body.reviewIds.length === 0) {
      return fail("BAD_REQUEST", "reviewIds is required", 400)
    }

    if (body.action !== "approve" && body.action !== "reject") {
      return fail("BAD_REQUEST", "Invalid moderation action", 400)
    }

    await requireAdminApiPermission(
      "review",
      body.action === "approve" ? "approve" : "reject",
    )

    const result = await bulkModerateReviews(body.reviewIds, body.action)

    if (!result.success) {
      return failFromMessage("Failed to moderate reviews", "BAD_REQUEST")
    }

    await auditAdminMutation({
      action: body.action === "approve" ? "review.approve" : "review.reject",
      entityType: "review",
      details: {
        reviewIds: body.reviewIds,
        count: body.reviewIds.length,
        bulk: true,
      },
    })

    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
