import { revokeAllOtherSessions } from "@/lib/actions/staff-profile"
import {
  auditAdminMutation,
  requireAdminApiPermission,
} from "@/lib/auth/admin-api"
import { failFromMessage, mapErrorToApi, ok } from "@/lib/utils/api-response"

export async function POST() {
  try {
    await requireAdminApiPermission("staff", "update")

    const result = await revokeAllOtherSessions()

    if (!result.success) {
      return failFromMessage(
        result.error || "Failed to revoke sessions",
        "BAD_REQUEST",
      )
    }

    await auditAdminMutation({
      action: "session.revoke_all",
      entityType: "session",
    })

    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
