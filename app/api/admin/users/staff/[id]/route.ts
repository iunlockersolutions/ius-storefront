import { NextRequest } from "next/server"

import { deleteStaffUser, updateStaffUser } from "@/lib/actions/admin-users"
import {
  auditAdminMutation,
  requireAdminApiPermission,
} from "@/lib/auth/admin-api"
import { failFromMessage, mapErrorToApi, ok } from "@/lib/utils/api-response"

interface RouteProps {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("staff", "update")

    const { id } = await params
    const body = await request.json()

    const result = await updateStaffUser({
      id,
      ...(typeof body?.name === "string" ? { name: body.name } : {}),
      ...(typeof body?.role === "string" ? { role: body.role } : {}),
    })

    if (!result.success) {
      return failFromMessage(
        result.error || "Failed to update user",
        "BAD_REQUEST",
      )
    }

    await auditAdminMutation({
      action: "user.update",
      entityType: "staff_user",
      entityId: id,
      details: {
        hasNameChange: typeof body?.name === "string",
        hasRoleChange: typeof body?.role === "string",
      },
    })

    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("staff", "delete")

    const { id } = await params
    const result = await deleteStaffUser(id)

    if (!result.success) {
      return failFromMessage(
        result.error || "Failed to delete user",
        "BAD_REQUEST",
      )
    }

    await auditAdminMutation({
      action: "user.delete",
      entityType: "staff_user",
      entityId: id,
    })

    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
