import { NextRequest } from "next/server"

import {
  createInstallmentOffer,
  getAdminInstallmentOffers,
} from "@/lib/actions/installment-offer"
import {
  auditAdminMutation,
  requireAdminApiPermission,
} from "@/lib/auth/admin-api"
import { mapErrorToApi, ok } from "@/lib/utils/api-response"

function parsePositiveNumber(value: string | null, fallback: number) {
  if (!value) return fallback

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return parsed
}

function parseStatus(value: string | null) {
  return value === "published" || value === "draft" || value === "all"
    ? value
    : undefined
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminApiPermission("installment_plan", "list")

    const searchParams = request.nextUrl.searchParams
    const result = await getAdminInstallmentOffers({
      page: parsePositiveNumber(searchParams.get("page"), 1),
      limit: parsePositiveNumber(searchParams.get("limit"), 20),
      search: searchParams.get("search") || undefined,
      status: parseStatus(searchParams.get("status")),
    })

    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminApiPermission("installment_plan", "create")

    const body = await request.json()
    const offer = await createInstallmentOffer(body)

    await auditAdminMutation({
      action: "installment_plan.create",
      entityType: "installment_plan",
      entityId: offer.id,
    })

    return ok(offer, 201)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
