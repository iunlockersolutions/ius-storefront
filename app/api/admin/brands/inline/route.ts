import { NextRequest } from "next/server"

import { createBrandInline } from "@/lib/actions/brand"
import {
  auditAdminMutation,
  requireAdminApiPermission,
} from "@/lib/auth/admin-api"
import { failFromMessage, mapErrorToApi, ok } from "@/lib/utils/api-response"

export async function POST(request: NextRequest) {
  try {
    await requireAdminApiPermission("brand", "create")

    const body = await request.json()
    const result = await createBrandInline(body)

    await auditAdminMutation({
      action: "brand.create",
      entityType: "brand",
      entityId: result.brand.id,
    })

    return ok(result, result.created ? 201 : 200)
  } catch (error) {
    if (error instanceof Error) {
      return failFromMessage(error.message, "BAD_REQUEST")
    }

    return mapErrorToApi(error)
  }
}
