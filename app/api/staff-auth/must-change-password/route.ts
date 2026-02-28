import { NextRequest } from "next/server"

import { setMustChangePasswordCookie } from "@/lib/actions/admin-auth"
import { mapErrorToApi, ok } from "@/lib/utils/api-response"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const mustChangePassword = Boolean(body?.mustChangePassword)

    await setMustChangePasswordCookie(mustChangePassword)

    return ok({ success: true })
  } catch (error) {
    return mapErrorToApi(error)
  }
}
