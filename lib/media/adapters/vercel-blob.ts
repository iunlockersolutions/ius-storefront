import { del, head, put } from "@vercel/blob"
import { handleUpload } from "@vercel/blob/client"

import {
  type MediaClientUploadHandlerOptions,
  registerMediaStorageAdapter,
} from "@/lib/media/adapter"

export const vercelBlobMediaAdapter = {
  provider: "vercel_blob" as const,

  async createClientUploadResponse(options: MediaClientUploadHandlerOptions) {
    return handleUpload({
      request: options.request,
      body: options.body,
      onBeforeGenerateToken: async (pathname, clientPayload) =>
        options.onBeforeGenerateToken(pathname, clientPayload),
      onUploadCompleted: options.onUploadCompleted,
    })
  },

  async deleteObject(urlOrPathname: string) {
    await del(urlOrPathname)
  },

  async uploadObject(input: {
    pathname: string
    body: Blob | Buffer | ArrayBuffer | string
    contentType?: string
    access?: "public"
  }) {
    const blob = await put(input.pathname, input.body, {
      access: input.access || "public",
      addRandomSuffix: false,
      contentType: input.contentType,
    })

    return {
      pathname: blob.pathname,
      url: blob.url,
      downloadUrl: blob.downloadUrl,
      contentType: blob.contentType,
    }
  },

  async headObject(urlOrPathname: string) {
    const blob = await head(urlOrPathname)

    return {
      pathname: blob.pathname,
      url: blob.url,
      downloadUrl: blob.downloadUrl,
      size: blob.size,
      contentType: blob.contentType,
    }
  },

  async resolveDelivery(input: { url: string; downloadUrl?: string | null }) {
    return {
      url: input.url,
      downloadUrl: input.downloadUrl || null,
    }
  },
}

registerMediaStorageAdapter(vercelBlobMediaAdapter)
