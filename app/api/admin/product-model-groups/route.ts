import { NextRequest } from "next/server"

import {
  createProductModelGroup,
  getProductModelGroups,
} from "@/lib/actions/product-model-group"
import {
  auditAdminMutation,
  requireAdminApiPermission,
} from "@/lib/auth/admin-api"
import { failFromMessage, mapErrorToApi, ok } from "@/lib/utils/api-response"

export async function GET() {
  try {
    await requireAdminApiPermission("product", "list")

    const groups = await getProductModelGroups({ includeInactive: true })

    return ok(groups)
  } catch (error) {
    return mapErrorToApi(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminApiPermission("product", "create")

    const body = await request.json()
    const group = await createProductModelGroup(body)

    await auditAdminMutation({
      action: "product.create",
      entityType: "product_model_group",
      entityId: group.id,
    })

    return ok(group, 201)
  } catch (error) {
    if (error instanceof Error) {
      return failFromMessage(error.message, "BAD_REQUEST")
    }

    return mapErrorToApi(error)
  }
}
