import { NextRequest } from "next/server"

import { getSiteSettings, updateSiteSettings } from "@/lib/actions/settings"
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

export async function GET() {
  try {
    await requireAdminApiPermission("settings", "read")

    const settings = await getSiteSettings()
    return ok(settings)
  } catch (error) {
    return mapErrorToApi(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdminApiPermission("settings", "update")

    const body = (await request.json()) as { settings?: Record<string, string> }

    if (!body.settings || typeof body.settings !== "object") {
      return fail("BAD_REQUEST", "settings payload is required", 400)
    }

    const result = await updateSiteSettings(body.settings)

    if (!result.success) {
      return failFromMessage("Failed to update settings", "BAD_REQUEST")
    }

    await auditAdminMutation({
      action: "settings.update",
      entityType: "settings",
      details: {
        keys: Object.keys(body.settings),
      },
    })

    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
