import { NextRequest } from "next/server"

import { removeRole } from "@/lib/actions/customer"
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
  params: Promise<{ id: string; roleId: string }>
}

export async function DELETE(_request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("customer", "update")

    const { id, roleId } = await params
    const result = await removeRole(id, roleId)

    if (!result.success) {
      return failFromMessage(
        result.error || "Failed to remove role",
        "BAD_REQUEST",
      )
    }

    await auditAdminMutation({
      action: "user.role_change",
      entityType: "customer",
      entityId: id,
      details: {
        roleId,
        operation: "remove",
      },
    })

    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
