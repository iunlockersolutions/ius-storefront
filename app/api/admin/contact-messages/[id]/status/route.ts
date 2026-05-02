import { NextRequest } from "next/server"

import { updateContactMessageStatus } from "@/lib/actions/contact-message"
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

const STATUS_VALUES = new Set(["unread", "open", "replied", "closed", "spam"])

export async function PATCH(request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("contact_message", "update")

    const { id } = await params
    const body = (await request.json().catch(() => null)) as {
      status?: string
    } | null

    if (!body || !body.status || !STATUS_VALUES.has(body.status)) {
      return fail("BAD_REQUEST", "Invalid status value", 400)
    }

    const result = await updateContactMessageStatus({
      id,
      status: body.status as "unread" | "open" | "replied" | "closed" | "spam",
    })

    if (!result.success || !result.data) {
      return failFromMessage(
        result.error || "Failed to update status",
        "BAD_REQUEST",
      )
    }

    await auditAdminMutation({
      action: "contact_message.update_status",
      entityType: "contact_message",
      entityId: id,
      details: { status: body.status },
    })

    return ok(result.data)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
