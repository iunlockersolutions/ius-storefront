import { nanoid } from "nanoid"

import type {
  MediaDerivativeKind,
  MediaKind,
  MediaStorageProvider,
  MediaUploadConstraints,
} from "./types"

const IMAGE_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
] as const

const VIDEO_CONTENT_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const

const MEDIA_CONSTRAINTS: Record<MediaKind, MediaUploadConstraints> = {
  image: {
    allowedContentTypes: [...IMAGE_CONTENT_TYPES],
    maximumSizeInBytes: 10 * 1024 * 1024,
  },
  video: {
    allowedContentTypes: [...VIDEO_CONTENT_TYPES],
    maximumSizeInBytes: 250 * 1024 * 1024,
  },
}

export function getMediaUploadConstraints(
  kind: MediaKind,
): MediaUploadConstraints {
  return MEDIA_CONSTRAINTS[kind]
}

export function getMediaKindFromMimeType(mimeType: string): MediaKind | null {
  if (mimeType.startsWith("image/")) {
    return "image"
  }

  if (mimeType.startsWith("video/")) {
    return "video"
  }

  return null
}

export function getMediaProviderFromUrl(url: string): MediaStorageProvider {
  if (
    url.startsWith("https://") &&
    (url.includes(".vercel-storage.com/") ||
      url.includes(".public.blob.vercel-storage.com/"))
  ) {
    return "vercel_blob"
  }

  return "external_url"
}

export function buildMediaUploadPathname(
  entityType: "product",
  entityId: string,
  kind: MediaKind,
  filename: string,
) {
  const extension = filename.split(".").pop()?.toLowerCase() || "bin"
  return `${entityType}/${entityId}/${kind}/${nanoid()}.${extension}`
}

export function buildDerivativePathname(
  sourcePathname: string,
  kind: MediaDerivativeKind,
  extension: string,
) {
  const baseName = sourcePathname.replace(/\.[^.]+$/, "")
  return `${baseName}.${kind}.${extension}`
}

export function getAcceptedMediaInputValue() {
  return [...IMAGE_CONTENT_TYPES, ...VIDEO_CONTENT_TYPES].join(",")
}
