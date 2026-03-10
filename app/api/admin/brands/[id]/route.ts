import { NextRequest } from "next/server"

import { deleteBrand, getBrand, updateBrand } from "@/lib/actions/brand"
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
    await requireAdminApiPermission("brand", "read")

    const { id } = await params
    const brand = await getBrand(id)

    if (!brand) {
      return fail("NOT_FOUND", "Brand not found", 404)
    }

    return ok(brand)
  } catch (error) {
    return mapErrorToApi(error)
  }
}

export async function PATCH(request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("brand", "update")

    const { id } = await params
    const body = await request.json()
    const updated = await updateBrand(id, body)

    await auditAdminMutation({
      action: "brand.update",
      entityType: "brand",
      entityId: id,
    })

    return ok(updated)
  } catch (error) {
    return mapErrorToApi(error)
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("brand", "delete")

    const { id } = await params
    const result = await deleteBrand(id)

    if (!result.success) {
      return failFromMessage(result.error || "Failed to delete brand", "BAD_REQUEST")
    }

    await auditAdminMutation({
      action: "brand.delete",
      entityType: "brand",
      entityId: id,
    })

    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
