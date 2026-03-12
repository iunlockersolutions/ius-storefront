import { NextRequest } from "next/server"

import { adjustStock } from "@/lib/actions/inventory"
import {
  auditAdminMutation,
  requireAdminApiPermission,
} from "@/lib/auth/admin-api"
import { fail, mapErrorToApi, ok } from "@/lib/utils/api-response"

interface RouteProps {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("inventory", "adjust")

    const { id } = await params
    const body = (await request.json()) as {
      adjustment?: number
      reason?: string
    }

    if (
      typeof body.adjustment !== "number" ||
      typeof body.reason !== "string"
    ) {
      return fail("BAD_REQUEST", "Invalid stock adjustment payload", 400)
    }

    const result = await adjustStock({
      variantId: id,
      adjustment: body.adjustment,
      reason: body.reason,
    })

    await auditAdminMutation({
      action: "inventory.adjust",
      entityType: "inventory_variant",
      entityId: id,
      details: {
        adjustment: body.adjustment,
        reason: body.reason,
      },
    })

    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
