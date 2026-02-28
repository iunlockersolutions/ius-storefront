import { NextRequest } from "next/server"

import { getOrder } from "@/lib/actions/order"
import { requireAdminApiPermission } from "@/lib/auth/admin-api"
import { fail, mapErrorToApi, ok } from "@/lib/utils/api-response"

interface RouteProps {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("order", "read")

    const { id } = await params
    const result = await getOrder(id)

    if (!result.success || !result.data) {
      return fail("NOT_FOUND", result.error || "Order not found", 404)
    }

    return ok(result.data)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
