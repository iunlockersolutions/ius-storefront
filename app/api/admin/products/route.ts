import { NextRequest } from "next/server"

import { getProducts } from "@/lib/actions/product"
import { requireAdminApiPermission } from "@/lib/auth/admin-api"
import { fail, mapErrorToApi, ok } from "@/lib/utils/api-response"

function parsePositiveNumber(value: string | null, fallback: number) {
  if (!value) return fallback

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }

  return parsed
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminApiPermission("product", "list")

    const searchParams = request.nextUrl.searchParams

    const page = parsePositiveNumber(searchParams.get("page"), 1)
    const limit = parsePositiveNumber(searchParams.get("limit"), 20)
    const search = searchParams.get("search") || undefined
    const status = searchParams.get("status") || undefined
    const categoryId = searchParams.get("categoryId") || undefined
    const brandId = searchParams.get("brandId") || undefined
    const modelId = searchParams.get("modelId") || undefined

    const products = await getProducts({
      page,
      limit,
      search,
      status,
      categoryId,
      brandId,
      modelId,
    })

    return ok(products)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
