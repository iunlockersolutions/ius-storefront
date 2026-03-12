import { NextRequest } from "next/server"

import { deleteProduct, getProduct, updateProduct } from "@/lib/actions/product"
import {
  auditAdminMutation,
  requireAdminApiPermission,
} from "@/lib/auth/admin-api"
import { fail, mapErrorToApi, ok } from "@/lib/utils/api-response"

interface RouteProps {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("product", "read")

    const { id } = await params
    const product = await getProduct(id)

    if (!product) {
      return fail("NOT_FOUND", "Product not found", 404)
    }

    return ok(product)
  } catch (error) {
    return mapErrorToApi(error)
  }
}

export async function PATCH(request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("product", "update")

    const { id } = await params
    const body = await request.json()

    const updated = await updateProduct(id, body)

    await auditAdminMutation({
      action: "product.update",
      entityType: "product",
      entityId: id,
    })

    return ok(updated)
  } catch (error) {
    return mapErrorToApi(error)
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("product", "delete")

    const { id } = await params

    const result = await deleteProduct(id)

    await auditAdminMutation({
      action: "product.delete",
      entityType: "product",
      entityId: id,
    })

    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
