import { NextRequest } from "next/server"

import { getPendingBankTransfers } from "@/lib/actions/payment"
import { requireAdminApiPermission } from "@/lib/auth/admin-api"
import { mapErrorToApi, ok } from "@/lib/utils/api-response"

export async function GET(_request: NextRequest) {
  try {
    await requireAdminApiPermission("payment", "read")

    const transfers = await getPendingBankTransfers()
    return ok(transfers)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
