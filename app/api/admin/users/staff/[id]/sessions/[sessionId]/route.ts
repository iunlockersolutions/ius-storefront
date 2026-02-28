import { NextRequest } from "next/server"

import { revokeUserSession } from "@/lib/actions/admin-users"
import {
  auditAdminMutation,
  requireAdminApiPermission,
} from "@/lib/auth/admin-api"
import { failFromMessage, mapErrorToApi, ok } from "@/lib/utils/api-response"

interface RouteProps {
  params: Promise<{ id: string; sessionId: string }>
}

export async function DELETE(_request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("staff", "update")

    const { id, sessionId } = await params
    const result = await revokeUserSession(sessionId, id)

    if (!result.success) {
      return failFromMessage(
        result.error || "Failed to revoke session",
        "BAD_REQUEST",
      )
    }

    await auditAdminMutation({
      action: "session.revoke",
      entityType: "session",
      entityId: sessionId,
      details: {
        targetUserId: id,
      },
    })

    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
