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

function comparePrimaryThenSortOrder(
  left: ProductMediaItem,
  right: ProductMediaItem,
) {
  if (left.isPrimaryImage) {
    return -1
  }

  if (right.isPrimaryImage) {
    return 1
  }

  return left.sortOrder - right.sortOrder
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
    const selectedSpecificMedia = selectedGalleryVariantId
      ? media.filter(
          (item) =>
            item.variantAssignment.mode === "specific" &&
            item.variantAssignment.variantIds.includes(
              selectedGalleryVariantId,
            ),
        )
      : []
    const unselectedSpecificMedia = media.filter(
      (item) =>
        item.variantAssignment.mode === "specific" &&
        !selectedSpecificMedia.some((selected) => selected.id === item.id),
    )

    const ordered = [
      ...selectedSpecificMedia.sort(
        (left, right) => left.sortOrder - right.sortOrder,
      ),
      ...globalMedia.sort(comparePrimaryThenSortOrder),
      ...unselectedSpecificMedia.sort(
        (left, right) => left.sortOrder - right.sortOrder,
      ),
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
      <div className="w-full">
        <ManagedMediaGallery
          key={selectedGalleryVariantId ?? "all-variants"}
          media={galleryMedia}
          name={product.name}
        />
      </div>
      <div className="w-full">
        <ProductInfo
          product={product}
          initialIsFavorited={initialIsFavorited}
          onSelectedVariantChange={setSelectedGalleryVariantId}
        />
      </div>
    </>
  )
}
