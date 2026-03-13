export type AdminProductStatus = "draft" | "active" | "archived"
export type AdminProductDraftStep =
  | "basics"
  | "organization"
  | "media"
  | "options"
  | "review"

export interface AdminProductWorkflow {
  canPublish: boolean
  errors: string[]
}

export interface AdminProductCategoryAssignment {
  id: string
  isPrimary: boolean
}

export interface AdminProductOptionValue {
  id: string
  value: string
}

export interface AdminProductOption {
  id: string
  name: string
  values: AdminProductOptionValue[]
}

export interface AdminProductVariantSelection {
  optionName: string
  optionValue: string
}

export interface AdminProductVariant {
  id: string
  sku: string
  name: string
  price: string
  compareAtPrice: string | null
  costPrice: string | null
  weight: string | null
  isDefault: boolean
  isActive: boolean
  manageInventory: boolean
  inventoryTrackingMode: "quantity" | "serial"
  selections?: AdminProductVariantSelection[]
}

export interface AdminProductMediaDerivative {
  id: string
  kind: "blur" | "poster"
  pathname: string
  url: string
  downloadUrl: string | null
  mimeType: string
  byteSize: number | null
  width: number | null
  height: number | null
}

export interface AdminProductMedia {
  id: string
  assetId: string
  kind: "image" | "video"
  provider: "vercel_blob" | "external_url"
  access: "public" | "private"
  status: "pending" | "ready" | "failed" | "deleted"
  pathname: string
  url: string
  downloadUrl: string | null
  mimeType: string
  byteSize: number
  width: number | null
  height: number | null
  durationSeconds: number | null
  originalFilename: string
  placeholderDataUrl: string | null
  altText: string | null
  variantId?: string | null
  isPrimaryImage: boolean
  sortOrder: number
  derivatives: AdminProductMediaDerivative[]
}

export interface AdminProductDetail {
  id: string
  name: string
  slug: string
  description: string | null
  shortDescription: string | null
  brandId: string | null
  primaryCategoryId: string | null
  modelId: string | null
  status: AdminProductStatus
  draftStep: AdminProductDraftStep
  isFeatured: boolean
  metaTitle: string | null
  metaDescription: string | null
  createdAt: string | Date
  updatedAt: string | Date
  categories: AdminProductCategoryAssignment[]
  options: AdminProductOption[]
  variants: AdminProductVariant[]
  media?: AdminProductMedia[]
  workflow: AdminProductWorkflow
}

export interface AdminProductMutationPayload {
  name: string
  slug?: string
  description?: string
  shortDescription?: string
  brandId?: string | null
  primaryCategoryId?: string | null
  modelId?: string | null
  categoryIds: string[]
  status: AdminProductStatus
  draftStep: AdminProductDraftStep
  isFeatured: boolean
  metaTitle?: string
  metaDescription?: string
  options: Array<{
    name: string
    values: string[]
  }>
  variants: Array<{
    id?: string
    sku?: string
    name?: string
    price: string
    compareAtPrice?: string
    costPrice?: string
    weight?: string
    isDefault?: boolean
    isActive?: boolean
    manageInventory?: boolean
    inventoryTrackingMode?: "quantity" | "serial"
    optionValues: Record<string, string>
  }>
}
