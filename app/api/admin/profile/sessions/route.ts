import { getUserSessions } from "@/lib/actions/staff-profile"
import { requireAdminApiPermission } from "@/lib/auth/admin-api"
import { mapErrorToApi, ok } from "@/lib/utils/api-response"

export async function GET() {
  try {
    await requireAdminApiPermission("staff", "read")

    const sessions = await getUserSessions()
    return ok(sessions)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
