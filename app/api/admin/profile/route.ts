import { NextRequest } from "next/server"

import {
  getStaffProfile,
  updateStaffProfile,
} from "@/lib/actions/staff-profile"
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

export async function GET() {
  try {
    await requireAdminApiPermission("staff", "read")

    const profile = await getStaffProfile()
    return ok(profile)
  } catch (error) {
    return mapErrorToApi(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdminApiPermission("staff", "update")

    const body = (await request.json()) as { name?: string }

    if (!body.name || typeof body.name !== "string") {
      return fail("BAD_REQUEST", "name is required", 400)
    }

    const result = await updateStaffProfile({ name: body.name })

    if (!result.success) {
      return failFromMessage(
        result.error || "Failed to update profile",
        "BAD_REQUEST",
      )
    }

    await auditAdminMutation({
      action: "user.update",
      entityType: "staff_profile",
      details: {
        name: body.name,
      },
    })

    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
