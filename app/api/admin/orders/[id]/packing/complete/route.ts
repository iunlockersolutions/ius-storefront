import { NextRequest } from "next/server"

import { completeOrderPacking } from "@/lib/actions/order"
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
      carrier?: string
      trackingNumber?: string
      trackingUrl?: string
    }

    const result = await completeOrderPacking({
      orderId: id,
      notes: body.notes,
      carrier: body.carrier,
      trackingNumber: body.trackingNumber,
      trackingUrl: body.trackingUrl,
    })

    if (!result.success) {
      return failFromMessage(
        result.error || "Failed to complete packing",
        "BAD_REQUEST",
      )
    }

    await auditAdminMutation({
      action: "order.update_status",
      entityType: "order",
      entityId: id,
      details: {
        operation: "packing_complete",
        carrier: body.carrier,
        trackingNumber: body.trackingNumber,
        trackingUrl: body.trackingUrl,
      },
    })

    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
