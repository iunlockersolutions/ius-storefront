import { NextRequest } from "next/server"

import { moderateReview } from "@/lib/actions/review"
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

interface RouteProps {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteProps) {
  try {
    const { id } = await params
    const body = (await request.json()) as {
      action?: "approve" | "reject"
      moderationNotes?: string
    }

    if (body.action !== "approve" && body.action !== "reject") {
      return fail("BAD_REQUEST", "Invalid moderation action", 400)
    }

    await requireAdminApiPermission(
      "review",
      body.action === "approve" ? "approve" : "reject",
    )

    const result = await moderateReview(id, body.action, body.moderationNotes)

    if (!result.success) {
      return failFromMessage(
        result.error || "Failed to moderate review",
        "BAD_REQUEST",
      )
    }

    await auditAdminMutation({
      action: body.action === "approve" ? "review.approve" : "review.reject",
      entityType: "review",
      entityId: id,
      details: {
        moderationNotes: body.moderationNotes,
      },
    })

    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
