import { NextRequest } from "next/server"

import { resetStaffPassword } from "@/lib/actions/admin-users"
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
    await requireAdminApiPermission("staff", "update")

    const { id } = await params
    const result = await resetStaffPassword(id)

    if (!result.success) {
      return failFromMessage(
        result.error || "Failed to reset password",
        "BAD_REQUEST",
      )
    }

    await auditAdminMutation({
      action: "user.password_reset",
      entityType: "staff_user",
      entityId: id,
    })

    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
