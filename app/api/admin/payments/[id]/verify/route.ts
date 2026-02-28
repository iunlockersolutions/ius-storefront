import { NextRequest } from "next/server"

import { verifyBankTransfer } from "@/lib/actions/payment"
import {
  auditAdminMutation,
  requireAdminApiPermission,
} from "@/lib/auth/admin-api"
import {
  fail,
  failFromMessage,
  mapErrorToApi,
  ok,
} from "@/lib/utils/api-response"

interface RouteProps {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("payment", "verify")

    const { id } = await params
    const body = (await request.json()) as {
      approved?: boolean
      notes?: string
    }

    if (typeof body.approved !== "boolean") {
      return fail("BAD_REQUEST", "approved must be a boolean", 400)
    }

    const result = await verifyBankTransfer(id, body.approved, body.notes)

    if (!result.success) {
      return failFromMessage(
        result.error || "Verification failed",
        "BAD_REQUEST",
      )
    }

    await auditAdminMutation({
      action: "payment.verify",
      entityType: "payment",
      entityId: id,
      details: {
        approved: body.approved,
        notes: body.notes,
      },
    })

    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
