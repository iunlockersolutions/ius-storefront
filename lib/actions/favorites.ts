"use server"

import { revalidatePath } from "next/cache"

import { and, desc, eq } from "drizzle-orm"

import { getServerSession } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import { favorites, products, productVariants } from "@/lib/db/schema"
import { getPrimaryProductImageMap } from "@/lib/media/service"

import { addToCart } from "./cart"
import { withStorefrontCatalogFallback } from "./storefront-catalog-read"

// ============================================
// Get User Favorites
// ============================================

export async function getUserFavorites() {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return []
  }

  return withStorefrontCatalogFallback(
    "favorites:getUserFavorites",
    [],
    async () => {
      const userFavorites = await db
        .select({
          id: favorites.id,
          productId: favorites.productId,
          createdAt: favorites.createdAt,
          product: {
            id: products.id,
            name: products.name,
            slug: products.slug,
            shortDescription: products.shortDescription,
            basePrice: products.basePrice,
            compareAtPrice: products.compareAtPrice,
            isFeatured: products.isFeatured,
            status: products.status,
          },
        })
        .from(favorites)
        .innerJoin(products, eq(favorites.productId, products.id))
        .where(eq(favorites.userId, session.user.id))
        .orderBy(desc(favorites.createdAt))

      const imageMap = await withStorefrontCatalogFallback(
        "favorites:getUserFavorites:images",
        new Map<string, string>(),
        () =>
          getPrimaryProductImageMap(
            userFavorites.map((favorite) => favorite.productId),
          ),
      )

      return userFavorites.map((favorite) => ({
        ...favorite,
        product: {
          ...favorite.product,
          image: imageMap.get(favorite.productId) || null,
        },
      }))
    },
  )
}

// ============================================
// Check if Product is Favorited
// ============================================

export async function isProductFavorited(productId: string) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return false
  }

  return withStorefrontCatalogFallback(
    "favorites:isProductFavorited",
    false,
    async () => {
      const [favorite] = await db
        .select({ id: favorites.id })
        .from(favorites)
        .where(
          and(
            eq(favorites.userId, session.user.id),
            eq(favorites.productId, productId),
          ),
        )
        .limit(1)

      return !!favorite
    },
  )
}

// ============================================
// Toggle Favorite
// ============================================

export async function toggleFavorite(productId: string) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return { success: false, error: "Please sign in to add favorites" }
  }

  // Check if already favorited
  const [existing] = await db
    .select({ id: favorites.id })
    .from(favorites)
    .where(
      and(
        eq(favorites.userId, session.user.id),
        eq(favorites.productId, productId),
      ),
    )
    .limit(1)

  if (existing) {
    // Remove favorite
    await db.delete(favorites).where(eq(favorites.id, existing.id))
    revalidatePath("/favorites")
    return { success: true, isFavorited: false }
  } else {
    // Add favorite
    await db.insert(favorites).values({
      userId: session.user.id,
      productId,
    })
    revalidatePath("/favorites")
    return { success: true, isFavorited: true }
  }
}

// ============================================
// Add to Favorites
// ============================================

export async function addToFavorites(productId: string) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return { success: false, error: "Please sign in to add favorites" }
  }

  // Check if already favorited
  const [existing] = await db
    .select({ id: favorites.id })
    .from(favorites)
    .where(
      and(
        eq(favorites.userId, session.user.id),
        eq(favorites.productId, productId),
      ),
    )
    .limit(1)

  if (existing) {
    return { success: true, message: "Already in favorites" }
  }

  await db.insert(favorites).values({
    userId: session.user.id,
    productId,
  })

  revalidatePath("/favorites")
  return { success: true }
}

// ============================================
// Remove from Favorites
// ============================================

export async function removeFromFavorites(productId: string) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return { success: false, error: "Please sign in" }
  }

  await db
    .delete(favorites)
    .where(
      and(
        eq(favorites.userId, session.user.id),
        eq(favorites.productId, productId),
      ),
    )

  revalidatePath("/favorites")
  return { success: true }
}

// ============================================
// Get Favorites Count
// ============================================

export async function getFavoritesCount() {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return 0
  }

  return withStorefrontCatalogFallback(
    "favorites:getFavoritesCount",
    0,
    async () => {
      const result = await db
        .select({ id: favorites.id })
        .from(favorites)
        .where(eq(favorites.userId, session.user.id))

      return result.length
    },
  )
}

// ============================================
// Move to Cart (Add to cart and remove from favorites)
// ============================================

export async function moveToCart(productId: string) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return { success: false, error: "Please sign in" }
  }

  // Get the first available variant for this product
  const [variant] = await db
    .select({ id: productVariants.id })
    .from(productVariants)
    .where(eq(productVariants.productId, productId))
    .limit(1)

  if (!variant) {
    return { success: false, error: "Product not available" }
  }

  // Add to cart
  const cartResult = await addToCart(variant.id, 1)
  if (!cartResult.success) {
    return {
      success: false,
      error: cartResult.error || "Failed to add to cart",
    }
  }

  // Remove from favorites
  await db
    .delete(favorites)
    .where(
      and(
        eq(favorites.userId, session.user.id),
        eq(favorites.productId, productId),
      ),
    )

  revalidatePath("/favorites")
  revalidatePath("/cart")
  return { success: true }
}
