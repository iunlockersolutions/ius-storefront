import { NextRequest } from "next/server"

import { deleteReview } from "@/lib/actions/review"
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

export async function DELETE(_request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("review", "delete")

    const { id } = await params
    const result = await deleteReview(id)

    if (!result.success) {
      return failFromMessage(
        result.error || "Failed to delete review",
        "BAD_REQUEST",
      )
    }

    await auditAdminMutation({
      action: "review.delete",
      entityType: "review",
      entityId: id,
    })

    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
