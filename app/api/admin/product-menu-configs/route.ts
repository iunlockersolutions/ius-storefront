import { getCategoryBrandMenuConfigs } from "@/lib/actions/category-brand-menu-config"
import { requireAdminApiPermission } from "@/lib/auth/admin-api"
import { mapErrorToApi, ok } from "@/lib/utils/api-response"

export async function GET() {
  try {
    await requireAdminApiPermission("category", "list")

    const configs = await getCategoryBrandMenuConfigs()

    return ok(configs)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
