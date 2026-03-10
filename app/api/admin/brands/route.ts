import { NextRequest } from "next/server"

import { createBrand, getBrands } from "@/lib/actions/brand"
import {
  auditAdminMutation,
  requireAdminApiPermission,
} from "@/lib/auth/admin-api"
import {
  failFromMessage,
  mapErrorToApi,
  ok,
} from "@/lib/utils/api-response"

export async function GET() {
  try {
    await requireAdminApiPermission("brand", "list")

    const brands = await getBrands()
    return ok(brands)
  } catch (error) {
    return mapErrorToApi(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminApiPermission("brand", "create")

    const body = await request.json()
    const result = await createBrand(body)

    if (!result.success) {
      return failFromMessage(result.error || "Failed to create brand", "BAD_REQUEST")
    }

    await auditAdminMutation({
      action: "brand.create",
      entityType: "brand",
      entityId: result.data?.id,
    })

    return ok(result.data, 201)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
