"use client"

import Link from "next/link"

import { Package } from "lucide-react"

import { ManagedMediaImage } from "@/components/shared/media/managed-media-image"
import { Badge } from "@/components/ui/badge"
import { cn, formatCurrency } from "@/lib/utils"

export interface ProductCardProduct {
  id: string
  name: string
  slug: string
  shortDescription: string | null
  basePrice: string
  compareAtPrice: string | null
  isFeatured: boolean
  image: string | null
  brand?: {
    id: string | null
    name: string | null
    slug: string | null
  } | null
}

interface ProductCardProps {
  product: ProductCardProduct
}

export function ProductCard({ product }: ProductCardProps) {
  const price = parseFloat(product.basePrice)
  const comparePrice = product.compareAtPrice
    ? parseFloat(product.compareAtPrice)
    : null
  const hasDiscount = comparePrice !== null && comparePrice > price
  const discountPercent = hasDiscount
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : 0

  return (
    <Link
      href={`/products/${product.slug}`}
      className="mx-auto block h-[480px] w-full max-w-[380px] rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4"
      aria-label={`View ${product.name}`}
    >
      <article className="flex h-full flex-col">
        <div className="relative h-[380px] w-full overflow-hidden rounded-lg bg-white ring-1 ring-zinc-950/5">
          <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-zinc-50" />

          <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5 sm:left-4 sm:top-4">
            {hasDiscount && (
              <Badge className="h-7 rounded-full bg-rose-600 px-3 text-[11px] font-semibold text-white shadow-sm shadow-rose-600/20 sm:h-8 sm:px-4 sm:text-sm">
                Save {discountPercent}%
              </Badge>
            )}
            {product.isFeatured && (
              <Badge
                variant="outline"
                className="h-6 rounded-full border-zinc-200 bg-white/90 px-2.5 text-[10px] font-medium text-zinc-700 backdrop-blur sm:text-xs"
              >
                Featured
              </Badge>
            )}
          </div>

          {product.image ? (
            <div className="absolute inset-0">
              <ManagedMediaImage
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 380px"
              />
            </div>
          ) : (
            <div className="relative flex h-full items-center justify-center">
              <Package className="h-14 w-14 text-zinc-300 sm:h-16 sm:w-16" />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2 items-center px-2 pt-5 text-center sm:px-3">
          {product.brand?.name && (
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              {product.brand.name}
            </p>
          )}
          <h3 className="line-clamp-2 max-w-84 text-lg font-semibold leading-tight text-zinc-950 sm:text-xl">
            {product.name}
          </h3>

          <div className="mt-1 flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1">
            <span
              className={cn(
                "text-base font-normal leading-none sm:text-lg",
                hasDiscount ? "text-rose-600" : "text-primary",
              )}
            >
              {formatCurrency(price)}
            </span>
            {hasDiscount && (
              <span className="text-sm leading-none text-zinc-400 line-through decoration-rose-500 decoration-2">
                {formatCurrency(comparePrice)}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
