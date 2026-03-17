import { NextRequest } from "next/server"

import { getPaymentStats } from "@/lib/actions/payment"
import { requireAdminApiPermission } from "@/lib/auth/admin-api"
import { mapErrorToApi, ok } from "@/lib/utils/api-response"

export async function GET(_request: NextRequest) {
  try {
    await requireAdminApiPermission("payment", "read")

    const stats = await getPaymentStats()
    return ok(stats)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
