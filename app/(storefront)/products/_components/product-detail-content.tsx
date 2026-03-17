"use client"

import { useMemo, useState } from "react"

import { ManagedMediaGallery } from "@/components/shared/media/managed-media-gallery"

import { ProductInfo } from "./product-info"

type ProductInfoProduct = React.ComponentProps<typeof ProductInfo>["product"]

type ProductMediaItem = {
  id: string
  assetId: string
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
  variantAssignment: {
    mode: "all" | "specific"
    variantIds: string[]
  }
}

interface ProductDetailContentProps {
  product: ProductInfoProduct & {
    media?: ProductMediaItem[]
  }
  initialIsFavorited?: boolean
}

export function ProductDetailContent({
  product,
  initialIsFavorited = false,
}: ProductDetailContentProps) {
  const [selectedGalleryVariantId, setSelectedGalleryVariantId] = useState<
    string | null
  >(null)

  const galleryMedia = useMemo(() => {
    const media = product.media ?? []
    const globalMedia = media.filter(
      (item) => item.variantAssignment.mode === "all",
    )
    const orderedGlobalMedia = [...globalMedia].sort((left, right) => {
      if (left.isPrimaryImage) {
        return -1
      }

      if (right.isPrimaryImage) {
        return 1
      }

      return left.sortOrder - right.sortOrder
    })

    if (!selectedGalleryVariantId) {
      return orderedGlobalMedia
    }

    const specificMedia = media.filter(
      (item) =>
        item.variantAssignment.mode === "specific" &&
        item.variantAssignment.variantIds.includes(selectedGalleryVariantId),
    )

    const ordered = [
      ...specificMedia.sort((left, right) => left.sortOrder - right.sortOrder),
      ...orderedGlobalMedia,
    ]

    const seenAssetIds = new Set<string>()

    return ordered.filter((item) => {
      if (seenAssetIds.has(item.assetId)) {
        return false
      }

      seenAssetIds.add(item.assetId)
      return true
    })
  }, [product.media, selectedGalleryVariantId])

  return (
    <>
      <ManagedMediaGallery
        key={selectedGalleryVariantId ?? "all-variants"}
        media={galleryMedia}
        name={product.name}
      />
      <ProductInfo
        product={product}
        initialIsFavorited={initialIsFavorited}
        onSelectedVariantChange={setSelectedGalleryVariantId}
      />
    </>
  )
}
