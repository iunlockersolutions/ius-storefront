import { NextRequest } from "next/server"

import { markNotificationsRead } from "@/lib/actions/notification"
import {
  auditAdminMutation,
  requireAdminApiPermission,
} from "@/lib/auth/admin-api"
import { failFromMessage, mapErrorToApi, ok } from "@/lib/utils/api-response"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: NextRequest) {
  try {
    await requireAdminApiPermission("contact_message", "list")

    const body = (await request.json().catch(() => ({}))) as {
      ids?: unknown
    }

    let ids: string[] | undefined
    if (Array.isArray(body.ids)) {
      ids = body.ids.filter(
        (value): value is string =>
          typeof value === "string" && UUID_RE.test(value),
      )
    }

    const result = await markNotificationsRead({ ids })

    if (!result.success || !result.data) {
      return failFromMessage(
        result.error || "Failed to mark notifications read",
        "BAD_REQUEST",
      )
    }

    await auditAdminMutation({
      action: "notification.mark_read",
      entityType: "notification",
      details: {
        scope: ids && ids.length > 0 ? "specific" : "all",
        count: result.data.updated,
      },
    })

    return ok(result.data)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
