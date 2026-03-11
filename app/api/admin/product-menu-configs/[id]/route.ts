import { NextRequest } from "next/server"

import { updateCategoryBrandMenuConfig } from "@/lib/actions/category-brand-menu-config"
import {
  auditAdminMutation,
  requireAdminApiPermission,
} from "@/lib/auth/admin-api"
import { failFromMessage, mapErrorToApi, ok } from "@/lib/utils/api-response"

interface RouteProps {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("category", "update")

    const { id } = await params
    const body = await request.json()
    const config = await updateCategoryBrandMenuConfig(id, body)

    await auditAdminMutation({
      action: "category.update",
      entityType: "category_brand_menu_config",
      entityId: id,
    })

    return ok(config)
  } catch (error) {
    if (error instanceof Error) {
      return failFromMessage(error.message, "BAD_REQUEST")
    }

    return mapErrorToApi(error)
  }
}
