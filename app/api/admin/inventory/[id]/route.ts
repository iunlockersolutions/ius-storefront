import { getInventoryDetail } from "@/lib/actions/inventory"
import { requireAdminApiPermission } from "@/lib/auth/admin-api"
import { mapErrorToApi, ok } from "@/lib/utils/api-response"

interface RouteProps {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("inventory", "read")

    const { id } = await params
    const detail = await getInventoryDetail(id)

    return ok(detail)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
