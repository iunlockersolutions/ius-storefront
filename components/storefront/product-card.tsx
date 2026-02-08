"use client"

import Image from "next/image"
import Link from "next/link"

import { Package, ShoppingCart } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

interface Product {
  id: string
  name: string
  slug: string
  shortDescription: string | null
  basePrice: string
  compareAtPrice: string | null
  isFeatured: boolean
  image: string | null
}

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const price = parseFloat(product.basePrice)
  const comparePrice = product.compareAtPrice
    ? parseFloat(product.compareAtPrice)
    : null
  const hasDiscount = comparePrice && comparePrice > price
  const discountPercent = hasDiscount
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : 0

  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="group h-full overflow-hidden transition-all hover:shadow-lg hover:border-primary/50">
        {/* Image */}
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.isFeatured && (
              <Badge className="bg-primary text-primary-foreground">
                Featured
              </Badge>
            )}
            {hasDiscount && (
              <Badge className="bg-red-500 text-white">
                -{discountPercent}%
              </Badge>
            )}
          </div>

          {/* Quick Add Button */}
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="secondary"
              className="h-9 w-9 rounded-full shadow-lg"
              onClick={(e) => {
                e.preventDefault()
                // TODO: Add to cart functionality
                console.log("Add to cart:", product.id)
              }}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-4">
          <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem]">
            {product.name}
          </h3>
          {product.shortDescription && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {product.shortDescription}
            </p>
          )}
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-lg font-bold">{formatCurrency(price)}</span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(comparePrice)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
