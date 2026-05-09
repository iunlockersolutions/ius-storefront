import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

import type { HandleUploadBody } from "@vercel/blob/client"
import { z } from "zod"

import { auth } from "@/lib/auth"
import { requireAdminApiPermission } from "@/lib/auth/admin-api"
import { vercelBlobMediaAdapter } from "@/lib/media/adapters/vercel-blob"
import { upsertMediaAssetFromUpload } from "@/lib/media/service"
import type { MediaUploadTokenPayload } from "@/lib/media/types"
import { getMediaUploadConstraints } from "@/lib/media/utils"

const clientPayloadSchema = z.object({
  entityType: z.literal("product"),
  entityId: z.string().uuid(),
  media: z.object({
    pathname: z.string().min(1),
    mimeType: z.string().min(1),
    byteSize: z.number().int().min(0),
    width: z.number().int().min(0).optional().nullable(),
    height: z.number().int().min(0).optional().nullable(),
    durationSeconds: z.number().int().min(0).optional().nullable(),
    etag: z.string().optional().nullable(),
    originalFilename: z.string().min(1),
    placeholderDataUrl: z.string().optional().nullable(),
    access: z.literal("public"),
    provider: z.enum(["vercel_blob", "external_url"]).optional(),
    kind: z.enum(["image", "video"]),
    context: z.enum(["gallery", "inline"]).default("gallery"),
    createdBy: z.string().uuid().optional().nullable(),
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
})

const completedTokenPayloadSchema = clientPayloadSchema.extend({
  userId: z.string().uuid(),
})

async function getAuthenticatedUserId() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  return session?.user?.id || null
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as HandleUploadBody

    const result = await vercelBlobMediaAdapter.createClientUploadResponse({
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        await requireAdminApiPermission("product", "update")

        const userId = await getAuthenticatedUserId()
        if (!userId) {
          throw new Error("Unauthorized")
        }

        const parsed = clientPayloadSchema.parse(
          JSON.parse(clientPayload || "{}"),
        )

        if (parsed.media.pathname !== pathname) {
          throw new Error("Upload pathname mismatch")
        }

        const constraints = getMediaUploadConstraints(parsed.media.kind)
        const tokenPayload: MediaUploadTokenPayload = {
          ...parsed,
          userId,
        }

        return {
          ...constraints,
          tokenPayload: JSON.stringify(tokenPayload),
          callbackUrl: new URL(
            "/api/admin/media/upload",
            request.url,
          ).toString(),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const parsed = completedTokenPayloadSchema.parse(
          JSON.parse(tokenPayload || "{}"),
        )

        if (parsed.media.context === "inline") {
          return
        }

        await upsertMediaAssetFromUpload({
          ...parsed.media,
          pathname: blob.pathname,
          url: blob.url,
          downloadUrl: blob.downloadUrl,
          mimeType: blob.contentType,
          createdBy: parsed.userId,
        })
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Media upload route error:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to handle upload",
      },
      { status: 400 },
    )
  }
}
