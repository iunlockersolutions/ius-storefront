import { NextRequest } from "next/server"

import { cancelOrder } from "@/lib/actions/order"
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
    await requireAdminApiPermission("order", "cancel")

    const { id } = await params
    const body = (await request.json().catch(() => ({}))) as {
      reason?: string
      idempotencyKey?: string
    }

    if (!body.reason?.trim()) {
      return fail("BAD_REQUEST", "Cancellation reason is required", 400)
    }

    const result = await cancelOrder({
      orderId: id,
      reason: body.reason,
      idempotencyKey: body.idempotencyKey,
    })

    if (!result.success) {
      return failFromMessage(result.error || "Failed to cancel order")
    }

    await auditAdminMutation({
      action: "order.cancel",
      entityType: "order",
      entityId: id,
      details: {
        reason: body.reason,
        idempotencyKey: body.idempotencyKey,
      },
    })

    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
