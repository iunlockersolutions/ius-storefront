import { NextRequest } from "next/server"

import { checkStaffLogin } from "@/lib/actions/admin-auth"
import { mapErrorToApi, ok } from "@/lib/utils/api-response"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = typeof body?.email === "string" ? body.email.trim() : ""

    if (!email) {
      return ok({
        isStaff: false,
        mustChangePassword: false,
        banned: false,
        banReason: null,
      })
    }

    const result = await checkStaffLogin(email)
    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
