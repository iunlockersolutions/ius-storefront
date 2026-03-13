"use client"

import { useCallback, useMemo, useRef } from "react"

import { upload } from "@vercel/blob/client"
import {
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  Loader2,
  Star,
  Trash2,
  Video,
} from "lucide-react"
import { toast } from "sonner"

import { ManagedMediaImage } from "@/components/shared/media/managed-media-image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useMediaUploadQueue } from "@/hooks/admin/use-media-upload-queue"
import {
  generateImagePreviewData,
  generateVideoPreviewData,
} from "@/lib/media/client"
import type { ProductMediaInput } from "@/lib/media/types"
import {
  buildDerivativePathname,
  buildMediaUploadPathname,
  getAcceptedMediaInputValue,
  getMediaKindFromMimeType,
} from "@/lib/media/utils"
import { cn } from "@/lib/utils"

export interface ProductMediaFieldValue extends ProductMediaInput {
  id?: string
  sortOrder: number
  persisted?: boolean
}

interface ProductMediaFieldProps {
  productId: string
  value: ProductMediaFieldValue[]
  onChange: (media: ProductMediaFieldValue[]) => void
  variants: Array<{ id: string; name: string }>
  disabled?: boolean
}

async function uploadDerivative(file: File, pathname: string) {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("pathname", pathname)
  formData.append("contentType", file.type)

  const response = await fetch("/api/admin/media/derivatives", {
    method: "POST",
    body: formData,
  })

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(
      body?.error?.message || body?.error || "Failed to upload derivative",
    )
  }

  return body.data as {
    pathname: string
    url: string
    downloadUrl: string
    contentType: string
  }
}

function normalizePrimaryImage(items: ProductMediaFieldValue[]) {
  const firstImageIndex = items.findIndex((item) => item.kind === "image")
  const primaryIndex =
    items.findIndex((item) => item.kind === "image" && item.isPrimaryImage) >= 0
      ? items.findIndex((item) => item.kind === "image" && item.isPrimaryImage)
      : firstImageIndex

  return items.map((item, index) => ({
    ...item,
    isPrimaryImage:
      item.kind === "image" && primaryIndex >= 0 && index === primaryIndex,
  }))
}

export function ProductMediaField({
  productId,
  value,
  onChange,
  variants,
  disabled = false,
}: ProductMediaFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const orderedValue = useMemo(
    () => [...value].sort((left, right) => left.sortOrder - right.sortOrder),
    [value],
  )

  const uploadOneFile = useCallback(
    async (file: File, onProgress: (percentage: number) => void) => {
      const kind = getMediaKindFromMimeType(file.type)

      if (!kind) {
        throw new Error("Only image and video files are supported")
      }

      const pathname = buildMediaUploadPathname(
        "product",
        productId,
        kind,
        file.name,
      )
      const derivatives: ProductMediaFieldValue["derivatives"] = []
      let width: number | null = null
      let height: number | null = null
      let durationSeconds: number | null = null
      let placeholderDataUrl: string | null = null

      if (kind === "image") {
        const preview = await generateImagePreviewData(file)
        width = preview.width
        height = preview.height
        placeholderDataUrl = preview.placeholderDataUrl

        const blurUpload = await uploadDerivative(
          preview.blurFile,
          buildDerivativePathname(pathname, "blur", "webp"),
        )

        derivatives.push({
          kind: "blur",
          pathname: blurUpload.pathname,
          url: blurUpload.url,
          downloadUrl: blurUpload.downloadUrl,
          mimeType: blurUpload.contentType,
          byteSize: preview.blurFile.size,
          width: Math.max(1, Math.round(preview.width / 20)),
          height: Math.max(1, Math.round(preview.height / 20)),
        })
      }

      if (kind === "video") {
        const preview = await generateVideoPreviewData(file)
        width = preview.width
        height = preview.height
        durationSeconds = preview.durationSeconds

        const posterUpload = await uploadDerivative(
          preview.posterFile,
          buildDerivativePathname(pathname, "poster", "jpg"),
        )

        derivatives.push({
          kind: "poster",
          pathname: posterUpload.pathname,
          url: posterUpload.url,
          downloadUrl: posterUpload.downloadUrl,
          mimeType: posterUpload.contentType,
          byteSize: preview.posterFile.size,
          width: preview.width,
          height: preview.height,
        })
      }

      const blob = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/admin/media/upload",
        clientPayload: JSON.stringify({
          entityType: "product",
          entityId: productId,
          media: {
            pathname,
            mimeType: file.type,
            byteSize: file.size,
            width,
            height,
            durationSeconds,
            etag: null,
            originalFilename: file.name,
            placeholderDataUrl,
            access: "public",
            kind,
            derivatives,
          },
        }),
        onUploadProgress: ({ percentage }) => onProgress(percentage),
      })

      return {
        pathname: blob.pathname,
        url: blob.url,
        downloadUrl: blob.downloadUrl,
        mimeType: blob.contentType,
        byteSize: file.size,
        width,
        height,
        durationSeconds,
        etag: null,
        originalFilename: file.name,
        placeholderDataUrl,
        access: "public" as const,
        kind,
        sortOrder: 0,
        derivatives,
      } satisfies ProductMediaFieldValue
    },
    [productId],
  )

  const { isUploading, progressByFile, uploadFiles, clearProgress } =
    useMediaUploadQueue(uploadOneFile)

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) {
        return
      }

      try {
        const uploaded = await uploadFiles(Array.from(files))
        const next = normalizePrimaryImage(
          [
            ...orderedValue,
            ...uploaded.map((item, index) => ({
              ...item,
              sortOrder: orderedValue.length + index,
              altText: item.originalFilename.replace(/\.[^.]+$/, ""),
              variantId: null,
              isPrimaryImage: false,
              persisted: false,
            })),
          ].map((item, index) => ({
            ...item,
            sortOrder: index,
          })),
        )

        onChange(next)
        toast.success(`${uploaded.length} media item(s) uploaded successfully`)
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to upload media",
        )
      } finally {
        Array.from(files).forEach((file) => clearProgress(file.name))
      }
    },
    [clearProgress, onChange, orderedValue, uploadFiles],
  )

  const removeItem = useCallback(
    async (index: number) => {
      const item = orderedValue[index]
      if (!item) {
        return
      }

      if (!item.persisted) {
        try {
          await fetch("/api/admin/media", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ pathname: item.pathname }),
          })
        } catch (error) {
          console.error("Failed to delete unattached media:", error)
        }
      }

      const next = normalizePrimaryImage(
        orderedValue
          .filter((_, currentIndex) => currentIndex !== index)
          .map((current, currentIndex) => ({
            ...current,
            sortOrder: currentIndex,
          })),
      )
      onChange(next)
    },
    [onChange, orderedValue],
  )

  const moveItem = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (toIndex < 0 || toIndex >= orderedValue.length) {
        return
      }

      const next = [...orderedValue]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      onChange(
        next.map((item, index) => ({
          ...item,
          sortOrder: index,
        })),
      )
    },
    [onChange, orderedValue],
  )

  const updateItem = useCallback(
    (index: number, updates: Partial<ProductMediaFieldValue>) => {
      onChange(
        orderedValue.map((item, currentIndex) =>
          currentIndex === index
            ? {
                ...item,
                ...updates,
              }
            : item,
        ),
      )
    },
    [onChange, orderedValue],
  )

  const setPrimaryImage = useCallback(
    (index: number) => {
      onChange(
        normalizePrimaryImage(
          orderedValue.map((item, currentIndex) => ({
            ...item,
            isPrimaryImage: item.kind === "image" && currentIndex === index,
          })),
        ),
      )
    },
    [onChange, orderedValue],
  )

  return (
    <div className="space-y-4">
      <div className="rounded-lg border-2 border-dashed border-neutral-300 transition-colors hover:border-neutral-400">
        <input
          ref={inputRef}
          type="file"
          accept={getAcceptedMediaInputValue()}
          multiple
          disabled={disabled || isUploading}
          className="sr-only"
          onChange={(event) => handleFiles(event.target.files)}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || isUploading}
          className="flex w-full flex-col items-center justify-center gap-2 p-8 text-center"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-neutral-600">Uploading media...</p>
            </>
          ) : (
            <>
              <div className="rounded-full bg-neutral-100 p-3">
                <ImagePlus className="h-6 w-6 text-neutral-600" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  Click to upload images or videos
                </p>
                <p className="text-xs text-neutral-500">
                  Product media is stored publicly for storefront delivery.
                </p>
              </div>
            </>
          )}
        </button>
      </div>

      {Object.keys(progressByFile).length > 0 ? (
        <div className="space-y-2 rounded-lg border p-3">
          {Object.entries(progressByFile).map(([fileName, percentage]) => (
            <div key={fileName} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="truncate">{fileName}</span>
                <span>{Math.round(percentage)}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-[width]"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {orderedValue.length > 0 ? (
        <div className="space-y-4">
          {orderedValue.map((item, index) => {
            const posterUrl = item.derivatives?.find(
              (derivative) => derivative.kind === "poster",
            )?.url

            return (
              <div
                key={item.assetId || item.pathname}
                className="grid gap-4 rounded-lg border p-4 md:grid-cols-[140px_1fr]"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                  {item.kind === "image" ? (
                    <ManagedMediaImage
                      src={item.url}
                      alt={item.altText || item.originalFilename}
                      placeholderDataUrl={item.placeholderDataUrl}
                      fill
                      className="object-cover"
                      sizes="140px"
                    />
                  ) : posterUrl ? (
                    <>
                      <ManagedMediaImage
                        src={posterUrl}
                        alt={item.altText || item.originalFilename}
                        fill
                        className="object-cover"
                        sizes="140px"
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-white">
                        <Video className="h-6 w-6" />
                      </span>
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <Video className="h-8 w-8" />
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">
                      {item.kind === "image" ? "Image" : "Video"}
                    </span>
                    {item.kind === "image" && item.isPrimaryImage ? (
                      <span className="rounded-full bg-primary px-2 py-1 text-xs font-medium text-white">
                        Primary image
                      </span>
                    ) : null}
                    <span className="text-xs text-muted-foreground">
                      {item.originalFilename}
                    </span>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`product-media-alt-${index}`}>
                        Alt text
                      </Label>
                      <Input
                        id={`product-media-alt-${index}`}
                        value={item.altText || ""}
                        onChange={(event) =>
                          updateItem(index, { altText: event.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Variant assignment</Label>
                      <Select
                        value={item.variantId || "__none__"}
                        onValueChange={(nextValue) =>
                          updateItem(index, {
                            variantId:
                              nextValue === "__none__" ? null : nextValue,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All variants" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">All variants</SelectItem>
                          {variants.map((variant) => (
                            <SelectItem key={variant.id} value={variant.id}>
                              {variant.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => moveItem(index, index - 1)}
                      disabled={index === 0}
                    >
                      <ArrowLeft className="mr-1 h-4 w-4" />
                      Earlier
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => moveItem(index, index + 1)}
                      disabled={index === orderedValue.length - 1}
                    >
                      Later
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                    {item.kind === "image" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant={item.isPrimaryImage ? "secondary" : "outline"}
                        onClick={() => setPrimaryImage(index)}
                      >
                        <Star
                          className={cn(
                            "mr-1 h-4 w-4",
                            item.isPrimaryImage && "fill-current",
                          )}
                        />
                        Set primary
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
