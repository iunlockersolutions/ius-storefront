import { NextRequest } from "next/server"

import { startOrderPacking } from "@/lib/actions/order"
import {
  auditAdminMutation,
  requireAdminApiPermission,
} from "@/lib/auth/admin-api"
import { failFromMessage, mapErrorToApi, ok } from "@/lib/utils/api-response"

interface RouteProps {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("order", "update")

    const { id } = await params
    const body = (await request.json().catch(() => ({}))) as {
      notes?: string
    }

    const result = await startOrderPacking({
      orderId: id,
      notes: body.notes,
    })

    if (!result.success) {
      return failFromMessage(
        result.error || "Failed to start packing",
        "BAD_REQUEST",
      )
    }

    await auditAdminMutation({
      action: "order.update_status",
      entityType: "order",
      entityId: id,
      details: {
        operation: "packing_start",
        notes: body.notes,
      },
    })

    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
