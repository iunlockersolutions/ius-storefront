import { NextRequest } from "next/server"

import { createModelInline } from "@/lib/actions/model"
import {
  auditAdminMutation,
  requireAdminApiPermission,
} from "@/lib/auth/admin-api"
import { failFromMessage, mapErrorToApi, ok } from "@/lib/utils/api-response"

export async function POST(request: NextRequest) {
  try {
    await requireAdminApiPermission("product", "create")

    const body = await request.json()
    const result = await createModelInline(body)

    await auditAdminMutation({
      action: "product.create",
      entityType: "model",
      entityId: result.model.id,
    })

    return ok(result, result.created ? 201 : 200)
  } catch (error) {
    if (error instanceof Error) {
      return failFromMessage(error.message, "BAD_REQUEST")
    }

    return mapErrorToApi(error)
  }
}
