import { NextRequest } from "next/server"

import { createCategory, getCategoriesFlat } from "@/lib/actions/category"
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

export async function GET() {
  try {
    await requireAdminApiPermission("category", "list")

    const categories = await getCategoriesFlat()

    return ok(categories)
  } catch (error) {
    return mapErrorToApi(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminApiPermission("category", "create")

    const body = await request.json()
    const result = await createCategory(body)

    if (!result.success) {
      return failFromMessage(
        result.error || "Failed to create category",
        "BAD_REQUEST",
      )
    }

    await auditAdminMutation({
      action: "category.create",
      entityType: "category",
      entityId: result.data?.id,
    })

    return ok(result.data, 201)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
