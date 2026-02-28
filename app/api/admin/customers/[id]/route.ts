import { NextRequest } from "next/server"

import { getCustomer } from "@/lib/actions/customer"
import { requireAdminApiPermission } from "@/lib/auth/admin-api"
import { fail, mapErrorToApi, ok } from "@/lib/utils/api-response"

interface RouteProps {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("customer", "read")

    const { id } = await params
    const customer = await getCustomer(id)

    if (!customer) {
      return fail("NOT_FOUND", "Customer not found", 404)
    }

    return ok(customer)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
