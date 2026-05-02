import { NextRequest } from "next/server"

import {
  deleteInstallmentOffer,
  getAdminInstallmentOffer,
  updateInstallmentOffer,
} from "@/lib/actions/installment-offer"
import {
  auditAdminMutation,
  requireAdminApiPermission,
} from "@/lib/auth/admin-api"
import { fail, mapErrorToApi, ok } from "@/lib/utils/api-response"

interface RouteProps {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("installment_plan", "read")

    const { id } = await params
    const offer = await getAdminInstallmentOffer(id)

    if (!offer) {
      return fail("NOT_FOUND", "Installment plan not found", 404)
    }

    return ok(offer)
  } catch (error) {
    return mapErrorToApi(error)
  }
}

export async function PATCH(request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("installment_plan", "update")

    const { id } = await params
    const body = await request.json()
    const offer = await updateInstallmentOffer(id, body)

    await auditAdminMutation({
      action: "installment_plan.update",
      entityType: "installment_plan",
      entityId: id,
      details: {
        isPublished:
          typeof body?.isPublished === "boolean" ? body.isPublished : undefined,
      },
    })

    return ok(offer)
  } catch (error) {
    return mapErrorToApi(error)
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("installment_plan", "delete")

    const { id } = await params
    const deleted = await deleteInstallmentOffer(id)

    await auditAdminMutation({
      action: "installment_plan.delete",
      entityType: "installment_plan",
      entityId: id,
    })

    return ok(deleted)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
