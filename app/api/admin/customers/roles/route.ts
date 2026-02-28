import { NextRequest } from "next/server"

import { getAllRoles } from "@/lib/actions/customer"
import { requireAdminApiPermission } from "@/lib/auth/admin-api"
import { mapErrorToApi, ok } from "@/lib/utils/api-response"

export async function GET(_request: NextRequest) {
  try {
    await requireAdminApiPermission("customer", "read")

    const roles = await getAllRoles()
    return ok(roles)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
