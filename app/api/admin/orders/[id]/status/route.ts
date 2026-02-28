import { NextRequest } from "next/server"

import { updateOrderStatus } from "@/lib/actions/order"
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
    const body = (await request.json()) as {
      status?:
        | "draft"
        | "pending_payment"
        | "paid"
        | "processing"
        | "packing"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
      notes?: string
    }

    if (!body.status) {
      return fail("BAD_REQUEST", "Status is required", 400)
    }

    const result = await updateOrderStatus({
      orderId: id,
      status: body.status,
      notes: body.notes,
    })

    if (!result.success) {
      return failFromMessage(
        result.error || "Failed to update status",
        "BAD_REQUEST",
      )
    }

    await auditAdminMutation({
      action: "order.update_status",
      entityType: "order",
      entityId: id,
      details: {
        status: body.status,
        notes: body.notes,
      },
    })

    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
