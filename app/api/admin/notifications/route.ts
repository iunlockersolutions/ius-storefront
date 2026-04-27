import { NextRequest } from "next/server"

import { getNotificationFeed } from "@/lib/actions/notification"
import { requireAdminApiPermission } from "@/lib/auth/admin-api"
import { failFromMessage, mapErrorToApi, ok } from "@/lib/utils/api-response"

function parsePositiveNumber(value: string | null, fallback: number) {
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return parsed
}

export async function GET(request: NextRequest) {
  try {
    // Notifications are scoped to the staff inbox; gate by the same
    // permission that lets staff see contact messages in the first place.
    await requireAdminApiPermission("contact_message", "list")

    const limit = parsePositiveNumber(
      request.nextUrl.searchParams.get("limit"),
      30,
    )

    const result = await getNotificationFeed({ limit })

    if (!result.success || !result.data) {
      return failFromMessage(
        result.error || "Failed to load notifications",
        "BAD_REQUEST",
      )
    }

    return ok(result.data)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
