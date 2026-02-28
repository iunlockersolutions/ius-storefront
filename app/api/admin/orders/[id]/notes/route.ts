import { NextRequest } from "next/server"

import { updateOrderNotes } from "@/lib/actions/order"
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

export async function PATCH(request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("order", "update")

    const { id } = await params
    const body = (await request.json()) as { adminNotes?: string }

    const result = await updateOrderNotes(id, body.adminNotes ?? "")

    if (!result.success) {
      return failFromMessage(
        result.error || "Failed to update notes",
        "BAD_REQUEST",
      )
    }

    await auditAdminMutation({
      action: "order.update_status",
      entityType: "order",
      entityId: id,
      details: {
        adminNotes: body.adminNotes ?? "",
        operation: "update_notes",
      },
    })

    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
