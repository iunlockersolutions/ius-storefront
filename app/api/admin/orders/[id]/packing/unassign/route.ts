import { NextRequest } from "next/server"

import { unassignOrderPackingUnit } from "@/lib/actions/order"
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
    await requireAdminApiPermission("order", "update")

    const { id } = await params
    const body = (await request.json()) as {
      orderItemId?: string
      inventoryUnitId?: string
    }

    if (
      typeof body.orderItemId !== "string" ||
      typeof body.inventoryUnitId !== "string"
    ) {
      return fail(
        "BAD_REQUEST",
        "Order item ID and inventory unit ID are required",
        400,
      )
    }

    const result = await unassignOrderPackingUnit({
      orderId: id,
      orderItemId: body.orderItemId,
      inventoryUnitId: body.inventoryUnitId,
    })

    if (!result.success) {
      return failFromMessage(
        result.error || "Failed to unassign serialized unit",
        "BAD_REQUEST",
      )
    }

    await auditAdminMutation({
      action: "order.update_status",
      entityType: "order",
      entityId: id,
      details: {
        operation: "packing_unassign",
        orderItemId: body.orderItemId,
        inventoryUnitId: body.inventoryUnitId,
      },
    })

    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
