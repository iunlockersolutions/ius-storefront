import { NextRequest } from "next/server"

import { assignContactMessage } from "@/lib/actions/contact-message"
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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function PATCH(request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("contact_message", "assign")

    const { id } = await params
    const body = (await request.json().catch(() => null)) as {
      assigneeId?: string | null
    } | null

    if (!body || (body.assigneeId !== null && body.assigneeId === undefined)) {
      return fail(
        "BAD_REQUEST",
        "assigneeId is required (use null to unassign)",
        400,
      )
    }

    if (body.assigneeId !== null && !UUID_RE.test(body.assigneeId ?? "")) {
      return fail("BAD_REQUEST", "Invalid assigneeId", 400)
    }

    const result = await assignContactMessage({
      id,
      assigneeId: body.assigneeId,
    })

    if (!result.success || !result.data) {
      return failFromMessage(
        result.error || "Failed to assign message",
        "BAD_REQUEST",
      )
    }

    await auditAdminMutation({
      action: "contact_message.assign",
      entityType: "contact_message",
      entityId: id,
      details: { assigneeId: body.assigneeId },
    })

    return ok(result.data)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
