import { NextRequest } from "next/server"

import {
  deleteProductModelGroup,
  getProductModelGroup,
  updateProductModelGroup,
} from "@/lib/actions/product-model-group"
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

interface RouteProps {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("product", "read")

    const { id } = await params
    const group = await getProductModelGroup(id)

    if (!group) {
      return fail("NOT_FOUND", "Product model group not found", 404)
    }

    return ok(group)
  } catch (error) {
    return mapErrorToApi(error)
  }
}

export async function PATCH(request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("product", "update")

    const { id } = await params
    const body = await request.json()
    const group = await updateProductModelGroup(id, body)

    await auditAdminMutation({
      action: "product.update",
      entityType: "product_model_group",
      entityId: id,
    })

    return ok(group)
  } catch (error) {
    if (error instanceof Error) {
      return failFromMessage(error.message, "BAD_REQUEST")
    }

    return mapErrorToApi(error)
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("product", "delete")

    const { id } = await params
    await deleteProductModelGroup(id)

    await auditAdminMutation({
      action: "product.delete",
      entityType: "product_model_group",
      entityId: id,
    })

    return ok({ success: true })
  } catch (error) {
    if (error instanceof Error) {
      return failFromMessage(error.message, "BAD_REQUEST")
    }

    return mapErrorToApi(error)
  }
}
