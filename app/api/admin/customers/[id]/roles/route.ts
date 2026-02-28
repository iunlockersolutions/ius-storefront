import { NextRequest } from "next/server"

import { assignRole } from "@/lib/actions/customer"
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

export async function POST(request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("customer", "update")

    const { id } = await params
    const body = (await request.json()) as { roleId?: string }

    if (!body.roleId) {
      return fail("BAD_REQUEST", "roleId is required", 400)
    }

    const result = await assignRole(id, body.roleId)

    if (!result.success) {
      return failFromMessage(
        result.error || "Failed to assign role",
        "BAD_REQUEST",
      )
    }

    await auditAdminMutation({
      action: "user.role_change",
      entityType: "customer",
      entityId: id,
      details: {
        roleId: body.roleId,
        operation: "assign",
      },
    })

    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
