import { NextRequest } from "next/server"

import { z } from "zod"

import {
  auditAdminMutation,
  requireAdminApiPermission,
} from "@/lib/auth/admin-api"
import { getProductMedia, syncProductMedia } from "@/lib/media/service"
import { fail, mapErrorToApi, ok } from "@/lib/utils/api-response"

const productMediaBodySchema = z.object({
  media: z.array(
    z.object({
      assetId: z.string().uuid().optional(),
      kind: z.enum(["image", "video"]),
      provider: z.enum(["vercel_blob", "external_url"]).optional(),
      access: z.enum(["public", "private"]),
      pathname: z.string().min(1),
      url: z.string().url(),
      downloadUrl: z.string().url().optional().nullable(),
      mimeType: z.string().min(1),
      byteSize: z.number().int().min(0),
      width: z.number().int().min(0).optional().nullable(),
      height: z.number().int().min(0).optional().nullable(),
      durationSeconds: z.number().int().min(0).optional().nullable(),
      etag: z.string().optional().nullable(),
      originalFilename: z.string().min(1),
      placeholderDataUrl: z.string().optional().nullable(),
      altText: z.string().optional().nullable(),
      variantId: z.string().uuid().optional().nullable(),
      isPrimaryImage: z.boolean().optional(),
      derivatives: z
        .array(
          z.object({
            kind: z.enum(["blur", "poster"]),
            pathname: z.string().min(1),
            url: z.string().url(),
            downloadUrl: z.string().url().optional().nullable(),
            mimeType: z.string().min(1),
            byteSize: z.number().int().min(0).optional().nullable(),
            width: z.number().int().min(0).optional().nullable(),
            height: z.number().int().min(0).optional().nullable(),
          }),
        )
        .optional(),
    }),
  ),
})

interface RouteProps {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("product", "read")

    const { id } = await params
    const media = await getProductMedia(id)

    return ok(media)
  } catch (error) {
    return mapErrorToApi(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminApiPermission("product", "update")

    const { id } = await params
    const body = productMediaBodySchema.safeParse(await request.json())

    if (!body.success) {
      return fail("BAD_REQUEST", "Invalid product media payload", 400)
    }

    const media = await syncProductMedia(id, body.data.media)

    await auditAdminMutation({
      action: "product.update",
      entityType: "product",
      entityId: id,
      details: {
        mediaCount: media.length,
      },
    })

    return ok(media)
  } catch (error) {
    return mapErrorToApi(error)
  }
}
