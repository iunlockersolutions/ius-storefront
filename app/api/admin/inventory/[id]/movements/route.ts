import { NextRequest } from "next/server"

import { getInventoryMovements } from "@/lib/actions/inventory"
import { requireAdminApiPermission } from "@/lib/auth/admin-api"
import { mapErrorToApi, ok } from "@/lib/utils/api-response"

interface RouteProps {
  params: Promise<{ id: string }>
}

function parsePositiveNumber(value: string | null, fallback: number) {
  if (!value) return fallback

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }

  return parsed
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("inventory", "read")

    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const page = parsePositiveNumber(searchParams.get("page"), 1)
    const limit = parsePositiveNumber(searchParams.get("limit"), 20)

    const result = await getInventoryMovements({
      variantId: id,
      page,
      limit,
    })

    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
