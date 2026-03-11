import { NextRequest } from "next/server"

import { updateProductImages } from "@/lib/actions/product"
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

type ProductImagePayload = {
  id?: string
  url: string
  altText?: string
  variantId?: string | null
  isPrimary: boolean
}

export async function PUT(request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("product", "update")

    const { id } = await params
    const body = (await request.json()) as { images?: ProductImagePayload[] }

    if (!Array.isArray(body.images)) {
      return fail("BAD_REQUEST", "Invalid images payload", 400)
    }

    const result = await updateProductImages(id, body.images)

    await auditAdminMutation({
      action: "product.update",
      entityType: "product",
      entityId: id,
      details: {
        imageCount: body.images.length,
      },
    })

    return ok(result)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
