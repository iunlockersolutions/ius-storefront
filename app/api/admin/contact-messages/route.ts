import { NextRequest } from "next/server"

import { getContactMessages } from "@/lib/actions/contact-message"
import { requireAdminApiPermission } from "@/lib/auth/admin-api"
import { failFromMessage, mapErrorToApi, ok } from "@/lib/utils/api-response"

const STATUS_VALUES = ["unread", "open", "replied", "closed", "spam"] as const

function parsePositiveNumber(value: string | null, fallback: number) {
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return parsed
}

function parseStatus(value: string | null) {
  return STATUS_VALUES.find((entry) => entry === value)
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminApiPermission("contact_message", "list")

    const searchParams = request.nextUrl.searchParams
    const page = parsePositiveNumber(searchParams.get("page"), 1)
    const limit = parsePositiveNumber(searchParams.get("limit"), 20)
    const search = searchParams.get("search") || undefined
    const status = parseStatus(searchParams.get("status"))
    const assigneeId = searchParams.get("assigneeId") || undefined

    const result = await getContactMessages({
      page,
      limit,
      search,
      status,
      assigneeId,
    })

    if (!result.success || !result.data) {
      return failFromMessage(
        result.error || "Failed to fetch contact messages",
        "BAD_REQUEST",
      )
    }

    return ok(result.data)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
