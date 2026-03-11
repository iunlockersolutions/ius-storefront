"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import {
  Check,
  Loader2,
  Minus,
  Plus,
  RotateCcw,
  Share2,
  Shield,
  ShoppingCart,
  Truck,
} from "lucide-react"
import { toast } from "sonner"

import { FavoriteButton } from "@/components/storefront/favorite-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addToCart } from "@/lib/actions/cart"
import { cn, formatCurrency } from "@/lib/utils"

interface ProductVariantSelection {
  optionId: string
  optionName: string
  optionValueId: string
  optionValue: string
}

interface ProductVariant {
  id: string
  name: string
  sku: string
  price: string
  compareAtPrice: string | null
  costPrice: string | null
  weight: string | null
  isDefault: boolean
  isActive: boolean
  inventory: {
    id: string
    quantity: number
    reservedQuantity: number
    lowStockThreshold: number | null
  } | null
  selections?: ProductVariantSelection[]
}

interface ProductOptionValue {
  id: string
  value: string
}

interface ProductOption {
  id: string
  name: string
  values: ProductOptionValue[]
}

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  shortDescription: string | null
  basePrice: string
  compareAtPrice: string | null
  isFeatured: boolean
  variants: ProductVariant[]
  brand: {
    id: string
    name: string
    slug: string
  } | null
  primaryCategory: {
    id: string
    name: string
    slug: string
  } | null
  model?: {
    id: string
    name: string
    slug: string
  } | null
  categories: {
    id: string
    name: string
    slug: string
  }[]
  options: ProductOption[]
}

interface ProductInfoProps {
  product: Product
  initialIsFavorited?: boolean
}

export function ProductInfo({
  product,
  initialIsFavorited = false,
}: ProductInfoProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const activeVariants = product.variants.filter((variant) => variant.isActive)
  const fallbackVariant =
    activeVariants.find((variant) => variant.isDefault) ||
    activeVariants[0] ||
    product.variants.find((variant) => variant.isDefault) ||
    product.variants[0] ||
    null

  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    fallbackVariant?.id || "",
  )
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >(() => {
    if (product.options.length === 0) {
      return {}
    }

    const baseSelections = Object.fromEntries(
      (fallbackVariant?.selections || []).map((selection) => [
        selection.optionId,
        selection.optionValueId,
      ]),
    )

    return product.options.reduce<Record<string, string>>(
      (accumulator, option) => {
        accumulator[option.id] =
          baseSelections[option.id] || option.values[0]?.id || ""
        return accumulator
      },
      {},
    )
  })
  const [quantity, setQuantity] = useState(1)

  const selectedVariant =
    product.options.length > 0
      ? activeVariants.find((variant) =>
          product.options.every((option) => {
            const selection = variant.selections?.find(
              (current) => current.optionId === option.id,
            )

            return selection?.optionValueId === selectedOptions[option.id]
          }),
        ) || fallbackVariant
      : activeVariants.find((variant) => variant.id === selectedVariantId) ||
        fallbackVariant
  const price = selectedVariant
    ? parseFloat(selectedVariant.price)
    : parseFloat(product.basePrice)
  const comparePrice = selectedVariant?.compareAtPrice
    ? parseFloat(selectedVariant.compareAtPrice)
    : product.compareAtPrice
      ? parseFloat(product.compareAtPrice)
      : null

  const hasDiscount = comparePrice && comparePrice > price
  const discountPercent = hasDiscount
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : 0

  const inStock = selectedVariant?.inventory
    ? selectedVariant.inventory.quantity -
        selectedVariant.inventory.reservedQuantity >
      0
    : true
  const stockQuantity = selectedVariant?.inventory
    ? selectedVariant.inventory.quantity -
      selectedVariant.inventory.reservedQuantity
    : 999

  const handleOptionChange = (optionId: string, optionValueId: string) => {
    const nextSelections = {
      ...selectedOptions,
      [optionId]: optionValueId,
    }

    const matchingVariant = activeVariants.find((variant) => {
      return Object.entries(nextSelections).every(
        ([selectedOptionId, selectedValueId]) => {
          const selection = variant.selections?.find(
            (current) => current.optionId === selectedOptionId,
          )

          return selection?.optionValueId === selectedValueId
        },
      )
    })

    if (matchingVariant?.selections?.length) {
      setSelectedOptions(
        Object.fromEntries(
          matchingVariant.selections.map((selection) => [
            selection.optionId,
            selection.optionValueId,
          ]),
        ),
      )
      setSelectedVariantId(matchingVariant.id)
      return
    }

    setSelectedOptions(nextSelections)
  }

  const isOptionValueAvailable = (optionId: string, optionValueId: string) => {
    return activeVariants.some((variant) => {
      const currentSelection = variant.selections?.find(
        (selection) => selection.optionId === optionId,
      )

      if (currentSelection?.optionValueId !== optionValueId) {
        return false
      }

      return Object.entries(selectedOptions).every(
        ([selectedOptionId, selectedValueId]) => {
          if (selectedOptionId === optionId) {
            return true
          }

          const selection = variant.selections?.find(
            (current) => current.optionId === selectedOptionId,
          )

          return selection?.optionValueId === selectedValueId
        },
      )
    })
  }

  const handleAddToCart = () => {
    if (!selectedVariant?.id) {
      toast.error("Please choose an available variant")
      return
    }

    startTransition(async () => {
      const result = await addToCart(selectedVariant.id, quantity)

      if (result.success) {
        // Dispatch event to update cart badge
        window.dispatchEvent(new Event("cart-updated"))

        toast.success("Added to cart!", {
          description: `${product.name} x ${quantity}`,
          action: {
            label: "View Cart",
            onClick: () => router.push("/cart"),
          },
        })
        // Reset quantity after adding
        setQuantity(1)
      } else {
        toast.error(result.error || "Failed to add to cart")
      }
    })
  }

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(stockQuantity, prev + delta)))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        {product.isFeatured && <Badge className="mb-2">Featured</Badge>}
        {product.brand && (
          <div className="mb-2">
            <Link
              href={`/brands/${product.brand.slug}`}
              className="text-sm font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground"
            >
              {product.brand.name}
            </Link>
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {product.name}
        </h1>
        {product.shortDescription && (
          <p className="mt-2 text-muted-foreground">
            {product.shortDescription}
          </p>
        )}
        {(product.primaryCategory || product.categories.length > 0) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {product.categories.map((category) => (
              <Link key={category.id} href={`/categories/${category.slug}`}>
                <Badge variant="secondary">{category.name}</Badge>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold">{formatCurrency(price)}</span>
        {hasDiscount && (
          <>
            <span className="text-lg text-muted-foreground line-through">
              {formatCurrency(comparePrice)}
            </span>
            <Badge className="bg-red-500 text-white">
              Save {discountPercent}%
            </Badge>
          </>
        )}
      </div>

      {/* Stock Status */}
      <div className="flex items-center gap-2">
        {inStock ? (
          <>
            <Check className="h-5 w-5 text-green-500" />
            <span className="text-green-600 font-medium">
              In Stock
              {stockQuantity <= 5 && stockQuantity > 0 && (
                <span className="text-amber-600 ml-1">
                  (Only {stockQuantity} left)
                </span>
              )}
            </span>
          </>
        ) : (
          <span className="text-red-500 font-medium">Out of Stock</span>
        )}
      </div>

      {product.options.length > 0 &&
        product.options.map((option) => {
          const selectedValueId = selectedOptions[option.id]
          const selectedValue = option.values.find(
            (value) => value.id === selectedValueId,
          )

          return (
            <div key={option.id} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Label>{option.name}</Label>
                <span className="text-sm text-muted-foreground">
                  {selectedValue?.value || "Select"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {option.values.map((value) => {
                  const isSelected = selectedValueId === value.id
                  const isAvailable = isOptionValueAvailable(
                    option.id,
                    value.id,
                  )

                  return (
                    <Button
                      key={value.id}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      className={cn("min-w-20", !isAvailable && "opacity-50")}
                      disabled={!isAvailable}
                      onClick={() => handleOptionChange(option.id, value.id)}
                    >
                      {value.value}
                    </Button>
                  )
                })}
              </div>
            </div>
          )
        })}

      {/* Quantity Selector */}
      <div className="space-y-2">
        <Label htmlFor="quantity">Quantity</Label>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            id="quantity"
            type="number"
            min={1}
            max={stockQuantity}
            value={quantity}
            onChange={(e) =>
              setQuantity(
                Math.max(
                  1,
                  Math.min(stockQuantity, parseInt(e.target.value) || 1),
                ),
              )
            }
            className="w-20 text-center"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleQuantityChange(1)}
            disabled={quantity >= stockQuantity}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          size="lg"
          className="flex-1"
          disabled={!inStock || isPending || !selectedVariant}
          onClick={handleAddToCart}
        >
          {isPending ? (
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <ShoppingCart className="h-5 w-5 mr-2" />
          )}
          {isPending ? "Adding..." : "Add to Cart"}
        </Button>
        <FavoriteButton
          productId={product.id}
          initialIsFavorited={initialIsFavorited}
          variant="button"
          size="lg"
        />
        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11"
          disabled={isPending}
        >
          <Share2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
        <div className="text-center">
          <Truck className="h-6 w-6 mx-auto text-primary" />
          <p className="mt-1 text-xs text-muted-foreground">Free Shipping</p>
        </div>
        <div className="text-center">
          <Shield className="h-6 w-6 mx-auto text-primary" />
          <p className="mt-1 text-xs text-muted-foreground">Secure Payment</p>
        </div>
        <div className="text-center">
          <RotateCcw className="h-6 w-6 mx-auto text-primary" />
          <p className="mt-1 text-xs text-muted-foreground">Easy Returns</p>
        </div>
      </div>

      {/* SKU */}
      {selectedVariant && (
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">SKU:</span> {selectedVariant.sku}
        </div>
      )}
    </div>
  )
}
