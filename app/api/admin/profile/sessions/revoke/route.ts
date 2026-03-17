import { NextRequest } from "next/server"

import { revokeSession } from "@/lib/actions/staff-profile"
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
    await requireAdminApiPermission("staff", "update")

    const body = (await request.json()) as { token?: string }

    if (!body.token) {
      return fail("BAD_REQUEST", "token is required", 400)
    }

    const result = await revokeSession(body.token)

    if (!result.success) {
      return failFromMessage(
        result.error || "Failed to revoke session",
        "BAD_REQUEST",
      )
    }

    await auditAdminMutation({
      action: "session.revoke",
      entityType: "session",
      entityId: body.token,
    })

    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
