import { NextRequest } from "next/server"

import { unbanStaffUser } from "@/lib/actions/admin-users"
import {
  auditAdminMutation,
  requireAdminApiPermission,
} from "@/lib/auth/admin-api"
import { failFromMessage, mapErrorToApi, ok } from "@/lib/utils/api-response"

interface RouteProps {
  params: Promise<{ id: string }>
}

export async function POST(_request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("staff", "ban")

    const { id } = await params
    const result = await unbanStaffUser(id)

    if (!result.success) {
      return failFromMessage(
        result.error || "Failed to unban user",
        "BAD_REQUEST",
      )
    }

    await auditAdminMutation({
      action: "user.unban",
      entityType: "staff_user",
      entityId: id,
    })

    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
