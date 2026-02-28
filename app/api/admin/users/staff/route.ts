import { NextRequest } from "next/server"

import { createStaffUser, listStaffUsers } from "@/lib/actions/admin-users"
import {
  auditAdminMutation,
  requireAdminApiPermission,
} from "@/lib/auth/admin-api"
import { failFromMessage, mapErrorToApi, ok } from "@/lib/utils/api-response"

type StaffRole = "admin" | "manager" | "support"

function parsePositiveNumber(value: string | null, fallback: number) {
  if (!value) return fallback

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }

  return parsed
}

function parseRole(value: string | null): StaffRole | undefined {
  if (!value) return undefined

  if (value === "admin" || value === "manager" || value === "support") {
    return value
  }

  return undefined
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminApiPermission("staff", "list")

    const searchParams = request.nextUrl.searchParams

    const search = searchParams.get("search") || undefined
    const role = parseRole(searchParams.get("role"))
    const page = parsePositiveNumber(searchParams.get("page"), 1)
    const limit = parsePositiveNumber(searchParams.get("limit"), 10)

    const result = await listStaffUsers({
      search,
      role,
      page,
      limit,
    })

    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminApiPermission("staff", "create")

    const body = await request.json()
    const result = await createStaffUser({
      name: typeof body?.name === "string" ? body.name : "",
      email: typeof body?.email === "string" ? body.email : "",
      role: body?.role,
    })

    if (!result.success) {
      return failFromMessage(
        result.error || "Failed to create staff user",
        "BAD_REQUEST",
      )
    }

    await auditAdminMutation({
      action: "user.create",
      entityType: "staff_user",
      entityId: result.userId,
      details: {
        role: body?.role,
        email: body?.email,
      },
    })

    return ok(result, 201)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
