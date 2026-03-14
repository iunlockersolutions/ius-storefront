import { NextRequest } from "next/server"

import { requireAdminApiPermission } from "@/lib/auth/admin-api"
import { vercelBlobMediaAdapter } from "@/lib/media/adapters/vercel-blob"
import { fail, mapErrorToApi, ok } from "@/lib/utils/api-response"

export async function POST(request: NextRequest) {
  try {
    await requireAdminApiPermission("product", "update")

    const formData = await request.formData()
    const file = formData.get("file")
    const pathname = formData.get("pathname")
    const contentType = formData.get("contentType")

    if (!(file instanceof File) || typeof pathname !== "string") {
      return fail("BAD_REQUEST", "Invalid derivative upload payload", 400)
    }

    const blob = await vercelBlobMediaAdapter.uploadObject({
      pathname,
      body: file,
      contentType: typeof contentType === "string" ? contentType : file.type,
      access: "public",
    })

    return ok(blob)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
