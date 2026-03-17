import { NextRequest } from "next/server"

import { z } from "zod"

import { requireAdminApiPermission } from "@/lib/auth/admin-api"
import { deleteUnattachedMediaByPathname } from "@/lib/media/service"
import { fail, mapErrorToApi, ok } from "@/lib/utils/api-response"

const deleteMediaSchema = z.object({
  pathname: z.string().min(1),
})

export async function DELETE(request: NextRequest) {
  try {
    await requireAdminApiPermission("product", "update")

    const body = deleteMediaSchema.parse(await request.json())
    const result = await deleteUnattachedMediaByPathname(body.pathname)

    return ok(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(
        "BAD_REQUEST",
        error.errors[0]?.message || "Invalid request",
        400,
      )
    }

    return mapErrorToApi(error)
  }
}
