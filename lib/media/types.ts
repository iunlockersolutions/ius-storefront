export type MediaStorageProvider = "vercel_blob" | "external_url"
export type MediaAccess = "public" | "private"
export type MediaKind = "image" | "video"
export type MediaStatus = "pending" | "ready" | "failed" | "deleted"
export type MediaDerivativeKind = "blur" | "poster"
export type ProductMediaAssignmentMode = "all" | "specific"
export type MediaContext = "gallery" | "inline"

export interface MediaDerivativeInput {
  kind: MediaDerivativeKind
  pathname: string
  url: string
  downloadUrl?: string | null
  mimeType: string
  byteSize?: number | null
  width?: number | null
  height?: number | null
}

export interface ProductMediaVariantAssignment {
  mode: ProductMediaAssignmentMode
  variantIds: string[]
}

export interface UploadedMediaSource {
  pathname: string
  url: string
  downloadUrl?: string | null
  mimeType: string
  byteSize: number
  width?: number | null
  height?: number | null
  durationSeconds?: number | null
  etag?: string | null
  originalFilename: string
  placeholderDataUrl?: string | null
  access: MediaAccess
  provider?: MediaStorageProvider
  kind: MediaKind
  context?: MediaContext
  createdBy?: string | null
  derivatives?: MediaDerivativeInput[]
}

export interface ProductMediaInput extends UploadedMediaSource {
  assetId?: string
  altText?: string | null
  variantAssignment?: ProductMediaVariantAssignment
  isPrimaryImage?: boolean
  status?: MediaStatus
}

export interface MediaUploadTokenPayload {
  entityType: "product"
  entityId: string
  userId: string
  media: Omit<UploadedMediaSource, "url" | "downloadUrl">
}

export interface MediaDelivery {
  url: string
  downloadUrl: string | null
}

export interface MediaUploadConstraints {
  allowedContentTypes: string[]
  maximumSizeInBytes: number
}
