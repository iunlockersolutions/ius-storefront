import { NextRequest } from "next/server"

import { revokeAllUserSessions } from "@/lib/actions/admin-users"
import {
  auditAdminMutation,
  requireAdminApiPermission,
} from "@/lib/auth/admin-api"
import { failFromMessage, mapErrorToApi, ok } from "@/lib/utils/api-response"

interface RouteProps {
  params: Promise<{ id: string }>
}

export async function DELETE(_request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("staff", "update")

    const { id } = await params
    const result = await revokeAllUserSessions(id)

    if (!result.success) {
      return failFromMessage(
        result.error || "Failed to revoke all sessions",
        "BAD_REQUEST",
      )
    }

    await auditAdminMutation({
      action: "session.revoke_all",
      entityType: "staff_user",
      entityId: id,
    })

    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
