import { NextRequest } from "next/server"

import {
  deleteContactMessage,
  getContactMessage,
} from "@/lib/actions/contact-message"
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
    await requireAdminApiPermission("contact_message", "read")

    const { id } = await params
    const result = await getContactMessage(id)

    if (!result.success || !result.data) {
      return fail("NOT_FOUND", result.error || "Contact message not found", 404)
    }

    return ok(result.data)
  } catch (error) {
    return mapErrorToApi(error)
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("contact_message", "delete")

    const { id } = await params
    const result = await deleteContactMessage(id)

    if (!result.success || !result.data) {
      return fail("NOT_FOUND", result.error || "Contact message not found", 404)
    }

    await auditAdminMutation({
      action: "contact_message.delete",
      entityType: "contact_message",
      entityId: id,
    })

    return ok(result.data)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
