import { NextRequest } from "next/server"

import { scanOrderPackingUnit } from "@/lib/actions/order"
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
      identifier?: string
    }

    if (
      typeof body.orderItemId !== "string" ||
      typeof body.identifier !== "string"
    ) {
      return fail(
        "BAD_REQUEST",
        "Order item ID and identifier are required",
        400,
      )
    }

    const result = await scanOrderPackingUnit({
      orderId: id,
      orderItemId: body.orderItemId,
      identifier: body.identifier,
    })

    if (!result.success) {
      return failFromMessage(
        result.error || "Failed to scan serialized unit",
        "BAD_REQUEST",
      )
    }

    await auditAdminMutation({
      action: "order.update_status",
      entityType: "order",
      entityId: id,
      details: {
        operation: "packing_scan",
        orderItemId: body.orderItemId,
        identifier: body.identifier,
      },
    })

    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
