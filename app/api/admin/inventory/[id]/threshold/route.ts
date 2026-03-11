import { NextRequest } from "next/server"

import { updateLowStockThreshold } from "@/lib/actions/inventory"
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
    await requireAdminApiPermission("inventory", "update")

    const { id } = await params
    const body = (await request.json()) as { threshold?: number }

    if (typeof body.threshold !== "number") {
      return fail("BAD_REQUEST", "Invalid threshold payload", 400)
    }

    const result = await updateLowStockThreshold(id, body.threshold)

    if (!result.success) {
      return failFromMessage(
        result.error || "Failed to update low stock threshold",
        "BAD_REQUEST",
      )
    }

    await auditAdminMutation({
      action: "inventory.adjust",
      entityType: "inventory_item",
      entityId: id,
      details: {
        threshold: body.threshold,
      },
    })

    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
