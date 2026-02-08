"use client"

import { useState } from "react"
import Image from "next/image"

import { ChevronLeft, ChevronRight, Package, ZoomIn } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ProductImage {
  id: string
  url: string
  altText: string | null
  isPrimary: boolean
  sortOrder: number
}

interface ProductGalleryProps {
  images: ProductImage[]
  name: string
}

export function ProductGallery({ images, name }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Sort images by sortOrder, primary first
  const sortedImages = [...images].sort((a, b) => {
    if (a.isPrimary) return -1
    if (b.isPrimary) return 1
    return a.sortOrder - b.sortOrder
  })

  const selectedImage = sortedImages[selectedIndex]

  const goToPrevious = () => {
    setSelectedIndex((prev) =>
      prev === 0 ? sortedImages.length - 1 : prev - 1,
    )
  }

  const goToNext = () => {
    setSelectedIndex((prev) =>
      prev === sortedImages.length - 1 ? 0 : prev + 1,
    )
  }

  if (sortedImages.length === 0) {
    return (
      <div className="relative aspect-square w-full rounded-lg border bg-muted flex items-center justify-center">
        <Package className="h-24 w-24 text-muted-foreground/30" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-muted group">
        <Image
          src={selectedImage.url}
          alt={selectedImage.altText || name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />

        {/* Navigation Arrows */}
        {sortedImages.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={goToNext}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Zoom Indicator */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
            <ZoomIn className="h-3 w-3" />
            Hover to zoom
          </div>
        </div>

        {/* Image Counter */}
        {sortedImages.length > 1 && (
          <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {selectedIndex + 1} / {sortedImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {sortedImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sortedImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border-2 transition-all",
                selectedIndex === index
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-transparent hover:border-muted-foreground/50",
              )}
            >
              <Image
                src={image.url}
                alt={image.altText || `${name} - Image ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
