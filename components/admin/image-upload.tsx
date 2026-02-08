"use client"

import { useCallback, useRef, useState } from "react"
import Image from "next/image"

import { GripVertical, ImagePlus, Loader2, Star, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface UploadedImage {
  id: string
  url: string
  altText?: string
  isPrimary?: boolean
}

interface ImageUploadProps {
  value: UploadedImage[]
  onChange: (images: UploadedImage[]) => void
  maxImages?: number
  folder?: string
  disabled?: boolean
  className?: string
}

export function ImageUpload({
  value = [],
  onChange,
  maxImages = 10,
  folder = "products",
  disabled = false,
  className,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return

      const remainingSlots = maxImages - value.length
      if (remainingSlots <= 0) {
        toast.error(`Maximum ${maxImages} images allowed`)
        return
      }

      const filesToUpload = Array.from(files).slice(0, remainingSlots)
      setIsUploading(true)

      const uploadPromises = filesToUpload.map(async (file) => {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("folder", folder)

        try {
          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || "Upload failed")
          }

          const data = await response.json()
          return {
            id: data.pathname || crypto.randomUUID(),
            url: data.url,
            altText: file.name.replace(/\.[^/.]+$/, ""),
            isPrimary: value.length === 0,
          } as UploadedImage
        } catch (error) {
          console.error("Upload error:", error)
          toast.error(
            error instanceof Error ? error.message : "Failed to upload image",
          )
          return null
        }
      })

      const results = await Promise.all(uploadPromises)
      const successfulUploads = results.filter(
        (r): r is UploadedImage => r !== null,
      )

      if (successfulUploads.length > 0) {
        // If this is the first image, make it primary
        const newImages = [...value]
        successfulUploads.forEach((img, idx) => {
          if (newImages.length === 0 && idx === 0) {
            img.isPrimary = true
          }
          newImages.push(img)
        })
        onChange(newImages)
        toast.success(
          `${successfulUploads.length} image(s) uploaded successfully`,
        )
      }

      setIsUploading(false)
    },
    [value, onChange, maxImages, folder],
  )

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles],
  )

  const removeImage = useCallback(
    async (index: number) => {
      const image = value[index]
      const newImages = [...value]
      newImages.splice(index, 1)

      // If we removed the primary image, make the first one primary
      if (image.isPrimary && newImages.length > 0) {
        newImages[0] = { ...newImages[0], isPrimary: true }
      }

      onChange(newImages)

      // Delete from blob storage
      try {
        await fetch("/api/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: image.url }),
        })
      } catch (error) {
        console.error("Failed to delete image from storage:", error)
      }
    },
    [value, onChange],
  )

  const setPrimary = useCallback(
    (index: number) => {
      const newImages = value.map((img, idx) => ({
        ...img,
        isPrimary: idx === index,
      }))
      onChange(newImages)
    },
    [value, onChange],
  )

  const moveImage = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (toIndex < 0 || toIndex >= value.length) return
      const newImages = [...value]
      const [moved] = newImages.splice(fromIndex, 1)
      newImages.splice(toIndex, 0, moved)
      onChange(newImages)
    },
    [value, onChange],
  )

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <div
        className={cn(
          "relative rounded-lg border-2 border-dashed transition-colors",
          dragActive
            ? "border-primary bg-primary/5"
            : "border-neutral-300 hover:border-neutral-400",
          disabled && "opacity-50 cursor-not-allowed",
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="sr-only"
          disabled={disabled || isUploading}
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
              <p className="text-sm text-neutral-600">Uploading...</p>
            </>
          ) : (
            <>
              <div className="rounded-full bg-neutral-100 p-3">
                <ImagePlus className="h-6 w-6 text-neutral-600" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-neutral-500">
                  PNG, JPG, WebP, GIF or AVIF (max 10MB)
                </p>
              </div>
            </>
          )}
        </button>
      </div>

      {/* Image Preview Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {value.map((image, index) => (
            <div
              key={image.id}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-lg border bg-neutral-100",
                image.isPrimary && "ring-2 ring-primary ring-offset-2",
              )}
            >
              <Image
                src={image.url}
                alt={image.altText || `Image ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              />

              {/* Primary Badge */}
              {image.isPrimary && (
                <div className="absolute top-2 left-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-white">
                  Primary
                </div>
              )}

              {/* Hover Actions */}
              <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                {/* Reorder buttons */}
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8"
                  onClick={() => moveImage(index, index - 1)}
                  disabled={index === 0}
                >
                  <GripVertical className="h-4 w-4" />
                </Button>

                {/* Set as Primary */}
                {!image.isPrimary && (
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={() => setPrimary(index)}
                    title="Set as primary"
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                )}

                {/* Remove */}
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="h-8 w-8"
                  onClick={() => removeImage(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image count */}
      <p className="text-xs text-neutral-500">
        {value.length} of {maxImages} images uploaded
      </p>
    </div>
  )
}
