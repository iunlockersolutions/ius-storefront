import { and, asc, desc, eq, inArray, sql } from "drizzle-orm"
import { z } from "zod"

import { db } from "@/lib/db"
import {
  mediaAssets,
  mediaDerivatives,
  productMedia,
  productMediaVariantAssignments,
  products,
  productVariants,
} from "@/lib/db/schema"
import {
  getMediaStorageAdapter,
  type MediaStorageAdapter,
} from "@/lib/media/adapter"
import type {
  MediaDelivery,
  MediaStorageProvider,
  ProductMediaInput,
  ProductMediaVariantAssignment,
  UploadedMediaSource,
} from "@/lib/media/types"
import { getMediaProviderFromUrl } from "@/lib/media/utils"

import "@/lib/media/adapters/vercel-blob"

const mediaDerivativeInputSchema = z.object({
  kind: z.enum(["blur", "poster"]),
  pathname: z.string().min(1),
  url: z.string().url(),
  downloadUrl: z.string().url().optional().nullable(),
  mimeType: z.string().min(1),
  byteSize: z.number().int().min(0).optional().nullable(),
  width: z.number().int().min(0).optional().nullable(),
  height: z.number().int().min(0).optional().nullable(),
})

const uploadedMediaSourceSchema = z.object({
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
  access: z.enum(["public", "private"]),
  provider: z.enum(["vercel_blob", "external_url"]).optional(),
  kind: z.enum(["image", "video"]),
  createdBy: z.string().uuid().optional().nullable(),
  derivatives: z.array(mediaDerivativeInputSchema).optional(),
})

const productMediaInputSchema = uploadedMediaSourceSchema.extend({
  assetId: z.string().uuid().optional(),
  altText: z.string().optional().nullable(),
  variantAssignment: z
    .object({
      mode: z.enum(["all", "specific"]),
      variantIds: z.array(z.string().uuid()).default([]),
    })
    .optional(),
  isPrimaryImage: z.boolean().optional(),
  status: z.enum(["pending", "ready", "failed", "deleted"]).optional(),
})

type DbExecutor = typeof db | any

export interface ProductMediaRecord {
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
  variantAssignment: ProductMediaVariantAssignment
  isPrimaryImage: boolean
  sortOrder: number
  derivatives: Array<{
    id: string
    kind: "blur" | "poster"
    pathname: string
    url: string
    downloadUrl: string | null
    mimeType: string
    byteSize: number | null
    width: number | null
    height: number | null
  }>
}

function getAdapterForProvider(provider: MediaStorageProvider | null) {
  if (!provider || provider === "external_url") {
    return null
  }

  return getMediaStorageAdapter(provider)
}

function normalizeProductMediaInputs(
  items: z.infer<typeof productMediaInputSchema>[],
) {
  const deduped: z.infer<typeof productMediaInputSchema>[] = []
  const seen = new Set<string>()

  for (const item of items) {
    if (seen.has(item.pathname)) {
      continue
    }

    seen.add(item.pathname)
    deduped.push(item)
  }

  const normalizedAssignments = deduped.map((item) => {
    const mode =
      item.variantAssignment?.mode === "specific" ? "specific" : "all"
    const variantIds =
      mode === "specific"
        ? Array.from(new Set(item.variantAssignment?.variantIds ?? []))
        : []

    return {
      ...item,
      variantAssignment: {
        mode,
        variantIds,
      } satisfies ProductMediaVariantAssignment,
    }
  })

  const imageIndexes = normalizedAssignments
    .map((item, index) => ({ item, index }))
    .filter(
      ({ item }) =>
        item.kind === "image" && item.variantAssignment.mode === "all",
    )

  if (imageIndexes.length === 0) {
    return normalizedAssignments.map((item) => ({
      ...item,
      isPrimaryImage: false,
    }))
  }

  const primaryIndex =
    imageIndexes.find(({ item }) => item.isPrimaryImage)?.index ??
    imageIndexes[0]?.index

  return normalizedAssignments.map((item, index) => ({
    ...item,
    isPrimaryImage:
      item.kind === "image" &&
      item.variantAssignment.mode === "all" &&
      index === primaryIndex,
  }))
}

export async function upsertMediaAssetFromUpload(
  input: UploadedMediaSource,
  executor: DbExecutor = db,
) {
  const validated = uploadedMediaSourceSchema.parse(input)
  const provider = validated.provider || getMediaProviderFromUrl(validated.url)
  const updateValues = {
    provider,
    access: validated.access,
    kind: validated.kind,
    status: "ready" as const,
    url: validated.url,
    downloadUrl: validated.downloadUrl || null,
    mimeType: validated.mimeType,
    byteSize: validated.byteSize,
    width: validated.width || null,
    height: validated.height || null,
    durationSeconds: validated.durationSeconds || null,
    etag: validated.etag || null,
    originalFilename: validated.originalFilename,
    placeholderDataUrl: validated.placeholderDataUrl || null,
    updatedAt: new Date(),
  }

  const [asset] = await executor
    .insert(mediaAssets)
    .values({
      provider,
      access: validated.access,
      kind: validated.kind,
      status: "ready",
      pathname: validated.pathname,
      url: validated.url,
      downloadUrl: validated.downloadUrl || null,
      mimeType: validated.mimeType,
      byteSize: validated.byteSize,
      width: validated.width || null,
      height: validated.height || null,
      durationSeconds: validated.durationSeconds || null,
      etag: validated.etag || null,
      originalFilename: validated.originalFilename,
      placeholderDataUrl: validated.placeholderDataUrl || null,
      createdBy: validated.createdBy || null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: mediaAssets.pathname,
      set: {
        ...updateValues,
        ...(validated.createdBy !== undefined
          ? { createdBy: validated.createdBy || null }
          : {}),
      },
    })
    .returning()

  const derivatives = validated.derivatives || []

  for (const derivative of derivatives) {
    await executor
      .insert(mediaDerivatives)
      .values({
        mediaAssetId: asset.id,
        kind: derivative.kind,
        pathname: derivative.pathname,
        url: derivative.url,
        downloadUrl: derivative.downloadUrl || null,
        mimeType: derivative.mimeType,
        byteSize: derivative.byteSize || null,
        width: derivative.width || null,
        height: derivative.height || null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [mediaDerivatives.mediaAssetId, mediaDerivatives.kind],
        set: {
          pathname: derivative.pathname,
          url: derivative.url,
          downloadUrl: derivative.downloadUrl || null,
          mimeType: derivative.mimeType,
          byteSize: derivative.byteSize || null,
          width: derivative.width || null,
          height: derivative.height || null,
          updatedAt: new Date(),
        },
      })
  }

  return asset
}

export async function getProductMedia(productId: string) {
  const rows = await db
    .select({
      id: productMedia.id,
      assetId: mediaAssets.id,
      kind: mediaAssets.kind,
      provider: mediaAssets.provider,
      access: mediaAssets.access,
      status: mediaAssets.status,
      pathname: mediaAssets.pathname,
      url: mediaAssets.url,
      downloadUrl: mediaAssets.downloadUrl,
      mimeType: mediaAssets.mimeType,
      byteSize: mediaAssets.byteSize,
      width: mediaAssets.width,
      height: mediaAssets.height,
      durationSeconds: mediaAssets.durationSeconds,
      originalFilename: mediaAssets.originalFilename,
      placeholderDataUrl: mediaAssets.placeholderDataUrl,
      altText: productMedia.altText,
      appliesToAllVariants: productMedia.appliesToAllVariants,
      isPrimaryImage: productMedia.isPrimaryImage,
      sortOrder: productMedia.sortOrder,
    })
    .from(productMedia)
    .innerJoin(mediaAssets, eq(productMedia.mediaAssetId, mediaAssets.id))
    .where(eq(productMedia.productId, productId))
    .orderBy(asc(productMedia.sortOrder), asc(productMedia.createdAt))

  if (rows.length === 0) {
    return [] as ProductMediaRecord[]
  }

  const assetIds = rows.map((row) => row.assetId)
  const productMediaIds = rows.map((row) => row.id)
  const derivativeRows = await db
    .select({
      id: mediaDerivatives.id,
      mediaAssetId: mediaDerivatives.mediaAssetId,
      kind: mediaDerivatives.kind,
      pathname: mediaDerivatives.pathname,
      url: mediaDerivatives.url,
      downloadUrl: mediaDerivatives.downloadUrl,
      mimeType: mediaDerivatives.mimeType,
      byteSize: mediaDerivatives.byteSize,
      width: mediaDerivatives.width,
      height: mediaDerivatives.height,
    })
    .from(mediaDerivatives)
    .where(inArray(mediaDerivatives.mediaAssetId, assetIds))

  const assignmentRows =
    productMediaIds.length === 0
      ? []
      : await db
          .select({
            productMediaId: productMediaVariantAssignments.productMediaId,
            variantId: productMediaVariantAssignments.variantId,
          })
          .from(productMediaVariantAssignments)
          .where(
            inArray(
              productMediaVariantAssignments.productMediaId,
              productMediaIds,
            ),
          )

  return rows.map((row) => ({
    ...row,
    byteSize: Number(row.byteSize),
    variantAssignment: {
      mode: row.appliesToAllVariants ? "all" : "specific",
      variantIds: row.appliesToAllVariants
        ? []
        : assignmentRows
            .filter((assignment) => assignment.productMediaId === row.id)
            .map((assignment) => assignment.variantId),
    } satisfies ProductMediaVariantAssignment,
    derivatives: derivativeRows
      .filter((derivative) => derivative.mediaAssetId === row.assetId)
      .map((derivative) => ({
        ...derivative,
        byteSize:
          derivative.byteSize === null ? null : Number(derivative.byteSize),
      })),
  }))
}

export async function resolveMediaDelivery(
  assetId: string,
): Promise<MediaDelivery | null> {
  const [asset] = await db
    .select({
      provider: mediaAssets.provider,
      url: mediaAssets.url,
      downloadUrl: mediaAssets.downloadUrl,
    })
    .from(mediaAssets)
    .where(eq(mediaAssets.id, assetId))
    .limit(1)

  if (!asset) {
    return null
  }

  const adapter = getAdapterForProvider(asset.provider)

  if (!adapter) {
    return {
      url: asset.url,
      downloadUrl: asset.downloadUrl || null,
    }
  }

  return adapter.resolveDelivery(asset)
}

export async function syncProductMedia(
  productId: string,
  mediaItems: ProductMediaInput[],
) {
  const validatedInputs = normalizeProductMediaInputs(
    z.array(productMediaInputSchema).parse(mediaItems),
  )

  const [product, variantRows] = await Promise.all([
    db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1)
      .then((rows) => rows[0]),
    db
      .select({ id: productVariants.id })
      .from(productVariants)
      .where(eq(productVariants.productId, productId)),
  ])

  const validVariantIds = new Set(variantRows.map((variant) => variant.id))
  const validated = validatedInputs.map((item) => ({
    ...item,
    variantAssignment: {
      mode: item.variantAssignment.mode,
      variantIds: item.variantAssignment.variantIds.filter((variantId) =>
        validVariantIds.has(variantId),
      ),
    } satisfies ProductMediaVariantAssignment,
  }))

  if (!product) {
    throw new Error("Product not found")
  }

  for (const item of validated) {
    if (
      item.variantAssignment.mode === "specific" &&
      item.variantAssignment.variantIds.length === 0
    ) {
      throw new Error(
        "Variant-specific media must be assigned to at least one product variant",
      )
    }

    if (item.isPrimaryImage && item.variantAssignment.mode !== "all") {
      throw new Error(
        "Only media assigned to all variants can be used as the primary image",
      )
    }
  }

  const previousMedia = await db
    .select({
      assetId: mediaAssets.id,
      pathname: mediaAssets.pathname,
      provider: mediaAssets.provider,
      url: mediaAssets.url,
    })
    .from(productMedia)
    .innerJoin(mediaAssets, eq(productMedia.mediaAssetId, mediaAssets.id))
    .where(eq(productMedia.productId, productId))

  await db.transaction(async (tx) => {
    const attachedMedia: Array<{
      assetId: string
      variantAssignment: ProductMediaVariantAssignment
    }> = []

    for (const item of validated) {
      const asset =
        item.assetId ??
        (
          await upsertMediaAssetFromUpload(
            {
              pathname: item.pathname,
              url: item.url,
              downloadUrl: item.downloadUrl || null,
              mimeType: item.mimeType,
              byteSize: item.byteSize,
              width: item.width || null,
              height: item.height || null,
              durationSeconds: item.durationSeconds || null,
              etag: item.etag || null,
              originalFilename: item.originalFilename,
              placeholderDataUrl: item.placeholderDataUrl || null,
              access: item.access,
              provider: item.provider,
              kind: item.kind,
              createdBy: item.createdBy || null,
              derivatives: item.derivatives || [],
            },
            tx,
          )
        ).id

      attachedMedia.push({
        assetId: asset,
        variantAssignment: item.variantAssignment,
      })
    }

    await tx.delete(productMedia).where(eq(productMedia.productId, productId))

    if (attachedMedia.length > 0) {
      const [insertedRows] = await Promise.all([
        tx
          .insert(productMedia)
          .values(
            validated.map((item, index) => ({
              productId,
              mediaAssetId: attachedMedia[index]!.assetId,
              appliesToAllVariants: item.variantAssignment.mode === "all",
              altText: item.altText || null,
              sortOrder: index,
              isPrimaryImage: item.isPrimaryImage || false,
              updatedAt: new Date(),
            })),
          )
          .returning({ id: productMedia.id }),
      ])

      const assignmentValues = insertedRows.flatMap((row, index) => {
        const assignment = attachedMedia[index]!.variantAssignment

        if (assignment.mode === "all") {
          return []
        }

        return assignment.variantIds.map((variantId) => ({
          productMediaId: row.id,
          variantId,
        }))
      })

      if (assignmentValues.length > 0) {
        await tx.insert(productMediaVariantAssignments).values(assignmentValues)
      }
    }
  })

  const keptPathnames = new Set(validated.map((item) => item.pathname))
  const removedAssets = previousMedia.filter(
    (item) => !keptPathnames.has(item.pathname),
  )

  for (const removedAsset of removedAssets) {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(productMedia)
      .where(eq(productMedia.mediaAssetId, removedAsset.assetId))

    if (count > 0) {
      continue
    }

    const adapter = getAdapterForProvider(removedAsset.provider)
    if (adapter) {
      await adapter.deleteObject(removedAsset.url)
    }

    await db.delete(mediaAssets).where(eq(mediaAssets.id, removedAsset.assetId))
  }

  return getProductMedia(productId)
}

export async function deleteUnattachedMediaByPathname(pathname: string) {
  const [asset] = await db
    .select({
      id: mediaAssets.id,
      provider: mediaAssets.provider,
      url: mediaAssets.url,
    })
    .from(mediaAssets)
    .where(eq(mediaAssets.pathname, pathname))
    .limit(1)

  if (!asset) {
    return { success: true as const }
  }

  const [attached] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(productMedia)
    .where(eq(productMedia.mediaAssetId, asset.id))

  if (attached.count > 0) {
    throw new Error("Cannot delete media that is already attached to a product")
  }

  const adapter = getAdapterForProvider(asset.provider)
  if (adapter) {
    await adapter.deleteObject(asset.url)
  }

  await db.delete(mediaAssets).where(eq(mediaAssets.id, asset.id))

  return { success: true as const }
}

export async function getPrimaryProductImageMap(productIds: string[]) {
  if (productIds.length === 0) {
    return new Map<string, string>()
  }

  const rows = await db
    .select({
      productId: productMedia.productId,
      url: mediaAssets.url,
    })
    .from(productMedia)
    .innerJoin(mediaAssets, eq(productMedia.mediaAssetId, mediaAssets.id))
    .where(
      and(
        inArray(productMedia.productId, productIds),
        eq(productMedia.appliesToAllVariants, true),
        eq(productMedia.isPrimaryImage, true),
        eq(mediaAssets.kind, "image"),
      ),
    )

  return new Map(rows.map((row) => [row.productId, row.url]))
}

export async function getVariantSpecificProductImageMap(variantIds: string[]) {
  const uniqueVariantIds = Array.from(new Set(variantIds.filter(Boolean)))

  if (uniqueVariantIds.length === 0) {
    return new Map<string, string>()
  }

  const rows = await db
    .select({
      variantId: productMediaVariantAssignments.variantId,
      url: mediaAssets.url,
      sortOrder: productMedia.sortOrder,
      isPrimaryImage: productMedia.isPrimaryImage,
    })
    .from(productMediaVariantAssignments)
    .innerJoin(
      productMedia,
      eq(productMediaVariantAssignments.productMediaId, productMedia.id),
    )
    .innerJoin(mediaAssets, eq(productMedia.mediaAssetId, mediaAssets.id))
    .where(
      and(
        inArray(productMediaVariantAssignments.variantId, uniqueVariantIds),
        eq(mediaAssets.kind, "image"),
      ),
    )
    .orderBy(
      desc(productMedia.isPrimaryImage),
      asc(productMedia.sortOrder),
      asc(productMedia.createdAt),
    )

  const imageMap = new Map<string, string>()

  for (const row of rows) {
    if (!imageMap.has(row.variantId)) {
      imageMap.set(row.variantId, row.url)
    }
  }

  return imageMap
}
