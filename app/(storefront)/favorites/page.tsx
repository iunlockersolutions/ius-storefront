import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"

import { Heart, ShoppingBag } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getUserFavorites } from "@/lib/actions/favorites"
import { getServerSession } from "@/lib/auth/rbac"
import { formatCurrency } from "@/lib/utils"

import { FavoriteActions } from "./favorite-actions"

export default async function FavoritesPage() {
  const session = await getServerSession()

  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/favorites")
  }

  const favorites = await getUserFavorites()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold sm:text-3xl flex items-center gap-2">
          <Heart className="h-7 w-7 text-red-500" />
          My Favorites
        </h1>
        <p className="mt-2 text-muted-foreground">
          {favorites.length > 0
            ? `You have ${favorites.length} item${favorites.length > 1 ? "s" : ""} in your favorites`
            : "Save your favorite products here"}
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Heart className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold">No favorites yet</h2>
          <p className="mt-2 text-muted-foreground max-w-md">
            Start adding products to your favorites by clicking the heart icon
            on any product.
          </p>
          <Button asChild className="mt-6">
            <Link href="/products">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Browse Products
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((favorite) => {
            const product = favorite.product
            const hasDiscount =
              product.compareAtPrice &&
              Number(product.compareAtPrice) > Number(product.basePrice)
            const discountPercent = hasDiscount
              ? Math.round(
                  (1 -
                    Number(product.basePrice) /
                      Number(product.compareAtPrice)) *
                    100,
                )
              : 0

            return (
              <Card key={favorite.id} className="group overflow-hidden">
                <CardContent className="p-0">
                  {/* Product Image */}
                  <Link href={`/products/${product.slug}`}>
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ShoppingBag className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                      )}
                      {hasDiscount && (
                        <Badge className="absolute top-2 left-2 bg-red-500">
                          -{discountPercent}%
                        </Badge>
                      )}
                      {product.isFeatured && (
                        <Badge
                          variant="secondary"
                          className="absolute top-2 right-2"
                        >
                          Featured
                        </Badge>
                      )}
                    </div>
                  </Link>

                  {/* Product Details */}
                  <div className="p-4">
                    <Link href={`/products/${product.slug}`}>
                      <h3 className="font-medium line-clamp-2 hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    {product.shortDescription && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                        {product.shortDescription}
                      </p>
                    )}

                    {/* Price */}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="font-semibold text-lg">
                        {formatCurrency(Number(product.basePrice))}
                      </span>
                      {hasDiscount && (
                        <span className="text-sm text-muted-foreground line-through">
                          {formatCurrency(Number(product.compareAtPrice))}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <FavoriteActions
                      productId={product.id}
                      productName={product.name}
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
