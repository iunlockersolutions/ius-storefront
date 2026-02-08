"use client"

import { useState, useTransition } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { addToCart } from "@/lib/actions/cart"
import { formatCurrency } from "@/lib/utils"

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
  category: {
    id: string
    name: string
    slug: string
  } | null
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
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants.find((v) => v.isDefault)?.id ||
      product.variants[0]?.id ||
      "",
  )
  const [quantity, setQuantity] = useState(1)

  const selectedVariant = product.variants.find(
    (v) => v.id === selectedVariantId,
  )
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

  const handleAddToCart = () => {
    if (!selectedVariantId) {
      toast.error("Please select a product option")
      return
    }

    startTransition(async () => {
      const result = await addToCart(selectedVariantId, quantity)

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
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {product.name}
        </h1>
        {product.shortDescription && (
          <p className="mt-2 text-muted-foreground">
            {product.shortDescription}
          </p>
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

      {/* Variant Selector */}
      {product.variants.length > 1 && (
        <div className="space-y-2">
          <Label htmlFor="variant">Select Option</Label>
          <Select
            value={selectedVariantId}
            onValueChange={setSelectedVariantId}
          >
            <SelectTrigger id="variant" className="w-full">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {product.variants
                .filter((v) => v.isActive)
                .map((variant) => (
                  <SelectItem key={variant.id} value={variant.id}>
                    {variant.name}
                    {variant.price !== product.basePrice && (
                      <span className="ml-2 text-muted-foreground">
                        ({formatCurrency(parseFloat(variant.price))})
                      </span>
                    )}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}

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
          disabled={!inStock || isPending}
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
