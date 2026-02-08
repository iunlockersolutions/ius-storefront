"use server"

import { and, desc, eq, gte, inArray, sql } from "drizzle-orm"

import { db } from "@/lib/db"
import {
  categories,
  orderItems,
  orders,
  productImages,
  products,
  productVariants,
} from "@/lib/db/schema"

// ============================================
// Get Featured Products
// ============================================

export async function getFeaturedProducts(limit: number = 8) {
  const featuredProducts = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      shortDescription: products.shortDescription,
      basePrice: products.basePrice,
      compareAtPrice: products.compareAtPrice,
      isFeatured: products.isFeatured,
    })
    .from(products)
    .where(and(eq(products.status, "active"), eq(products.isFeatured, true)))
    .orderBy(desc(products.createdAt))
    .limit(limit)

  // Get primary images
  const productIds = featuredProducts.map((p) => p.id)
  const images =
    productIds.length > 0
      ? await db
          .select({
            productId: productImages.productId,
            url: productImages.url,
          })
          .from(productImages)
          .where(
            and(
              inArray(productImages.productId, productIds),
              eq(productImages.isPrimary, true),
            ),
          )
      : []

  const imageMap = new Map(images.map((img) => [img.productId, img.url]))

  return featuredProducts.map((p) => ({
    ...p,
    image: imageMap.get(p.id) || null,
  }))
}

// ============================================
// Get New Arrivals
// ============================================

export async function getNewArrivals(limit: number = 8) {
  // Get products created in the last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const newProducts = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      shortDescription: products.shortDescription,
      basePrice: products.basePrice,
      compareAtPrice: products.compareAtPrice,
      isFeatured: products.isFeatured,
      createdAt: products.createdAt,
    })
    .from(products)
    .where(
      and(
        eq(products.status, "active"),
        gte(products.createdAt, thirtyDaysAgo),
      ),
    )
    .orderBy(desc(products.createdAt))
    .limit(limit)

  // Get primary images
  const productIds = newProducts.map((p) => p.id)
  const images =
    productIds.length > 0
      ? await db
          .select({
            productId: productImages.productId,
            url: productImages.url,
          })
          .from(productImages)
          .where(
            and(
              inArray(productImages.productId, productIds),
              eq(productImages.isPrimary, true),
            ),
          )
      : []

  const imageMap = new Map(images.map((img) => [img.productId, img.url]))

  return newProducts.map((p) => ({
    ...p,
    image: imageMap.get(p.id) || null,
  }))
}

// ============================================
// Get Best Sellers
// ============================================

export async function getBestSellers(limit: number = 8) {
  // Get products with most sales in last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Get top selling product IDs
  const topSelling = await db
    .select({
      productId: productVariants.productId,
      totalSold: sql<number>`SUM(${orderItems.quantity})::int`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(productVariants, eq(orderItems.variantId, productVariants.id))
    .where(and(eq(orders.status, "paid"), gte(orders.createdAt, thirtyDaysAgo)))
    .groupBy(productVariants.productId)
    .orderBy(desc(sql`SUM(${orderItems.quantity})`))
    .limit(limit)

  if (topSelling.length === 0) {
    // Fall back to featured products if no sales yet
    return getFeaturedProducts(limit)
  }

  const productIds = topSelling.map((p) => p.productId)

  const bestSellerProducts = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      shortDescription: products.shortDescription,
      basePrice: products.basePrice,
      compareAtPrice: products.compareAtPrice,
      isFeatured: products.isFeatured,
    })
    .from(products)
    .where(and(eq(products.status, "active"), inArray(products.id, productIds)))

  // Get primary images
  const images = await db
    .select({
      productId: productImages.productId,
      url: productImages.url,
    })
    .from(productImages)
    .where(
      and(
        inArray(productImages.productId, productIds),
        eq(productImages.isPrimary, true),
      ),
    )

  const imageMap = new Map(images.map((img) => [img.productId, img.url]))
  const salesMap = new Map(topSelling.map((p) => [p.productId, p.totalSold]))

  // Sort by sales count
  return bestSellerProducts
    .map((p) => ({
      ...p,
      image: imageMap.get(p.id) || null,
      totalSold: salesMap.get(p.id) || 0,
    }))
    .sort((a, b) => b.totalSold - a.totalSold)
}

// ============================================
// Get Featured Categories
// ============================================

export async function getFeaturedCategories(limit: number = 6) {
  const featuredCats = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      image: categories.image,
    })
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(categories.sortOrder)
    .limit(limit)

  // Get product count for each category
  const catIds = featuredCats.map((c) => c.id)
  const productCounts =
    catIds.length > 0
      ? await db
          .select({
            categoryId: products.categoryId,
            count: sql<number>`count(*)::int`,
          })
          .from(products)
          .where(
            and(
              eq(products.status, "active"),
              inArray(products.categoryId, catIds),
            ),
          )
          .groupBy(products.categoryId)
      : []

  const countMap = new Map(productCounts.map((c) => [c.categoryId, c.count]))

  return featuredCats.map((c) => ({
    ...c,
    productCount: countMap.get(c.id) || 0,
  }))
}

// ============================================
// Get Deal Products (Products with discount)
// ============================================

export async function getDealProducts(limit: number = 8) {
  const deals = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      shortDescription: products.shortDescription,
      basePrice: products.basePrice,
      compareAtPrice: products.compareAtPrice,
      isFeatured: products.isFeatured,
    })
    .from(products)
    .where(
      and(
        eq(products.status, "active"),
        sql`${products.compareAtPrice} IS NOT NULL AND ${products.compareAtPrice}::numeric > ${products.basePrice}::numeric`,
      ),
    )
    .orderBy(
      desc(
        sql`(${products.compareAtPrice}::numeric - ${products.basePrice}::numeric) / ${products.compareAtPrice}::numeric`,
      ),
    )
    .limit(limit)

  // Get primary images
  const productIds = deals.map((p) => p.id)
  const images =
    productIds.length > 0
      ? await db
          .select({
            productId: productImages.productId,
            url: productImages.url,
          })
          .from(productImages)
          .where(
            and(
              inArray(productImages.productId, productIds),
              eq(productImages.isPrimary, true),
            ),
          )
      : []

  const imageMap = new Map(images.map((img) => [img.productId, img.url]))

  return deals.map((p) => ({
    ...p,
    image: imageMap.get(p.id) || null,
  }))
}
