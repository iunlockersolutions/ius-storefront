import { getProductReceiveStockContext } from "@/lib/actions/inventory"
import { requireAdminApiPermission } from "@/lib/auth/admin-api"
import { fail, mapErrorToApi, ok } from "@/lib/utils/api-response"

interface RouteProps {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("inventory", "read")

    const { id } = await params
    const context = await getProductReceiveStockContext(id)

    if (context.variants.length === 0) {
      return fail(
        "BAD_REQUEST",
        "This product has no inventory-managed variants available for stock intake",
        400,
      )
    }

    return ok(context)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
