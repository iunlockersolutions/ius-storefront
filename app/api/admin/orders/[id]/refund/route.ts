import { NextRequest } from "next/server"

import { refundOrder } from "@/lib/actions/order"
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
    await requireAdminApiPermission("order", "refund")

    const { id } = await params
    const body = (await request.json().catch(() => ({}))) as {
      reason?: string
      idempotencyKey?: string
      lineDispositions?: Array<{
        orderItemId?: string
        disposition?: "restock" | "damaged" | "lost" | "no-return"
        quantity?: number
      }>
    }

    if (!body.reason?.trim()) {
      return fail("BAD_REQUEST", "Refund reason is required", 400)
    }

    if (!Array.isArray(body.lineDispositions)) {
      return fail("BAD_REQUEST", "lineDispositions is required", 400)
    }

    const invalidLine = body.lineDispositions.find(
      (line) =>
        !line.orderItemId ||
        !line.disposition ||
        !["restock", "damaged", "lost", "no-return"].includes(line.disposition),
    )

    if (invalidLine) {
      return fail(
        "BAD_REQUEST",
        "Each line disposition must include orderItemId and a valid disposition",
        400,
      )
    }

    const result = await refundOrder({
      orderId: id,
      reason: body.reason,
      idempotencyKey: body.idempotencyKey,
      lineDispositions: body.lineDispositions as Array<{
        orderItemId: string
        disposition: "restock" | "damaged" | "lost" | "no-return"
        quantity?: number
      }>,
    })

    if (!result.success) {
      return failFromMessage(result.error || "Failed to refund order")
    }

    await auditAdminMutation({
      action: "order.refund",
      entityType: "order",
      entityId: id,
      details: {
        reason: body.reason,
        idempotencyKey: body.idempotencyKey,
        lineDispositions: body.lineDispositions,
      },
    })

    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
