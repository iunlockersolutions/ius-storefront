import type { PutBlobResult } from "@vercel/blob"
import type { HandleUploadBody } from "@vercel/blob/client"

import type { MediaDelivery, MediaStorageProvider } from "./types"

export interface MediaClientUploadHandlerOptions {
  request: Request
  body: HandleUploadBody
  onBeforeGenerateToken: (
    pathname: string,
    clientPayload: string | null,
  ) => Promise<{
    allowedContentTypes: string[]
    maximumSizeInBytes: number
    tokenPayload?: string | null
    callbackUrl?: string
  }>
  onUploadCompleted?: (payload: {
    blob: PutBlobResult
    tokenPayload?: string | null
  }) => Promise<void>
}

export interface MediaStorageAdapter {
  provider: MediaStorageProvider
  createClientUploadResponse(
    options: MediaClientUploadHandlerOptions,
  ): Promise<{ clientToken?: string; response?: "ok"; type: string }>
  deleteObject(urlOrPathname: string): Promise<void>
  uploadObject(input: {
    pathname: string
    body: Blob | Buffer | ArrayBuffer | string
    contentType?: string
    access?: "public"
  }): Promise<{
    pathname: string
    url: string
    downloadUrl: string
    contentType: string
  }>
  headObject(urlOrPathname: string): Promise<{
    pathname: string
    url: string
    downloadUrl: string
    size: number
    contentType: string
  }>
  resolveDelivery(input: {
    url: string
    downloadUrl?: string | null
  }): Promise<MediaDelivery>
}

const adapters = new Map<MediaStorageProvider, MediaStorageAdapter>()

export function registerMediaStorageAdapter(adapter: MediaStorageAdapter) {
  adapters.set(adapter.provider, adapter)
}

export function getMediaStorageAdapter(provider: MediaStorageProvider) {
  const adapter = adapters.get(provider)

  if (!adapter) {
    throw new Error(`No media storage adapter registered for ${provider}`)
  }

  return adapter
}
