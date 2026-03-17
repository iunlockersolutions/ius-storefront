import { NextRequest } from "next/server"

import { changePassword } from "@/lib/actions/staff-profile"
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

    const body = (await request.json()) as {
      currentPassword?: string
      newPassword?: string
    }

    if (!body.currentPassword || !body.newPassword) {
      return fail(
        "BAD_REQUEST",
        "currentPassword and newPassword are required",
        400,
      )
    }

    const result = await changePassword({
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    })

    if (!result.success) {
      return failFromMessage(
        result.error || "Failed to change password",
        "BAD_REQUEST",
      )
    }

    await auditAdminMutation({
      action: "user.password_reset",
      entityType: "staff_profile",
      details: {
        operation: "change_password",
      },
    })

    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
