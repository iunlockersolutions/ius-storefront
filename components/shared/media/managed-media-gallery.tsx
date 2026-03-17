"use client"

import { useMemo, useState } from "react"

import { ChevronLeft, ChevronRight, Package, Play, Video } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { ManagedMediaImage } from "./managed-media-image"

interface GalleryMediaItem {
  id: string
  kind: "image" | "video"
  url: string
  altText: string | null
  placeholderDataUrl?: string | null
  sortOrder: number
  isPrimaryImage?: boolean
  derivatives?: Array<{
    kind: "blur" | "poster"
    url: string
  }>
}

interface ManagedMediaGalleryProps {
  media: GalleryMediaItem[]
  name: string
}

function getPosterUrl(item: GalleryMediaItem) {
  return item.derivatives?.find((derivative) => derivative.kind === "poster")
    ?.url
}

export function ManagedMediaGallery({ media, name }: ManagedMediaGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const sortedMedia = useMemo(() => [...media], [media])

  const selectedItem = sortedMedia[selectedIndex]

  if (sortedMedia.length === 0) {
    return (
      <div className="relative aspect-square w-full rounded-lg border bg-muted flex items-center justify-center">
        <Package className="h-24 w-24 text-muted-foreground/30" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="group relative aspect-square w-full overflow-hidden rounded-lg border bg-muted">
        {selectedItem.kind === "image" ? (
          <ManagedMediaImage
            src={selectedItem.url}
            alt={selectedItem.altText || name}
            placeholderDataUrl={selectedItem.placeholderDataUrl}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            preload
          />
        ) : (
          <video
            key={selectedItem.id}
            src={selectedItem.url}
            poster={getPosterUrl(selectedItem)}
            controls
            preload="metadata"
            playsInline
            className="h-full w-full object-cover"
          />
        )}

        {sortedMedia.length > 1 ? (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() =>
                setSelectedIndex((current) =>
                  current === 0 ? sortedMedia.length - 1 : current - 1,
                )
              }
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() =>
                setSelectedIndex((current) =>
                  current === sortedMedia.length - 1 ? 0 : current + 1,
                )
              }
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        ) : null}

        {selectedItem.kind === "video" ? (
          <div className="absolute left-3 top-3 rounded-full bg-black/70 p-2 text-white">
            <Video className="h-4 w-4" />
          </div>
        ) : null}
      </div>

      {sortedMedia.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sortedMedia.map((item, index) => {
            const posterUrl = item.kind === "video" ? getPosterUrl(item) : null

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  "relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border-2 transition-all",
                  selectedIndex === index
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-transparent hover:border-muted-foreground/50",
                )}
              >
                {item.kind === "image" ? (
                  <ManagedMediaImage
                    src={item.url}
                    alt={item.altText || `${name} media ${index + 1}`}
                    placeholderDataUrl={item.placeholderDataUrl}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : posterUrl ? (
                  <>
                    <ManagedMediaImage
                      src={posterUrl}
                      alt={item.altText || `${name} video ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                      <Play className="h-5 w-5 fill-current" />
                    </span>
                  </>
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                    <Video className="h-5 w-5" />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
