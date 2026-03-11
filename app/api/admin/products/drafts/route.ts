import { NextRequest } from "next/server"

import { createDraftProduct } from "@/lib/actions/product"
import {
  auditAdminMutation,
  requireAdminApiPermission,
} from "@/lib/auth/admin-api"
import { failFromMessage, mapErrorToApi, ok } from "@/lib/utils/api-response"

export async function POST(request: NextRequest) {
  try {
    await requireAdminApiPermission("product", "create")

    const body = await request.json()
    const result = await createDraftProduct(body)

    if (!result.success) {
      return failFromMessage(
        result.error || "Failed to create product draft",
        "BAD_REQUEST",
      )
    }

    await auditAdminMutation({
      action: "product.create",
      entityType: "product",
      entityId: result.data?.id,
      details: {
        mode: "draft",
      },
    })

    return ok(result.data, 201)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
