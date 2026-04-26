"use server"

import { unstable_cache } from "next/cache"

import { and, desc, eq, gte, inArray, sql } from "drizzle-orm"

import { db } from "@/lib/db"
import {
  categories,
  orderItems,
  orders,
  productCategoryAssignments,
  products,
  productVariants,
  reviews,
  users,
} from "@/lib/db/schema"
import { getPrimaryProductImageMap } from "@/lib/media/service"

import { withStorefrontCatalogFallback } from "./storefront-catalog-read"

// ============================================
// Get Featured Products
// ============================================

export async function getFeaturedProducts(limit: number = 8) {
  return unstable_cache(
    async () => {
      const featuredProducts = await withStorefrontCatalogFallback(
        "storefront:getFeaturedProducts:products",
        [],
        () =>
          db
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
              and(eq(products.status, "active"), eq(products.isFeatured, true)),
            )
            .orderBy(desc(products.createdAt))
            .limit(limit),
      )

      const imageMap = await withStorefrontCatalogFallback(
        "storefront:getFeaturedProducts:images",
        new Map<string, string>(),
        () =>
          getPrimaryProductImageMap(
            featuredProducts.map((product) => product.id),
          ),
      )

      return featuredProducts.map((product) => ({
        ...product,
        image: imageMap.get(product.id) || null,
      }))
    },
    [`featured-products-${limit}`],
    {
      revalidate: 3600, // Cache for 1 hour
      tags: ["featured-products"],
    },
  )()
}

// ============================================
// Get New Arrivals
// ============================================

export async function getNewArrivals(limit: number = 8) {
  return unstable_cache(
    async () => {
      // Get products created in the last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const newProducts = await withStorefrontCatalogFallback(
        "storefront:getNewArrivals:products",
        [],
        () =>
          db
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
            .limit(limit),
      )

      const imageMap = await withStorefrontCatalogFallback(
        "storefront:getNewArrivals:images",
        new Map<string, string>(),
        () =>
          getPrimaryProductImageMap(newProducts.map((product) => product.id)),
      )

      return newProducts.map((product) => ({
        ...product,
        image: imageMap.get(product.id) || null,
      }))
    },
    [`new-arrivals-${limit}`],
    {
      revalidate: 1800, // Cache for 30 minutes
      tags: ["new-arrivals"],
    },
  )()
}

// ============================================
// Get Best Sellers
// ============================================

export async function getBestSellers(limit: number = 8) {
  return unstable_cache(
    async () => {
      // Get products with most sales in last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      // Get top selling product IDs
      const topSelling = await withStorefrontCatalogFallback(
        "storefront:getBestSellers:sales",
        [] as Array<{ productId: string; totalSold: number }>,
        () =>
          db
            .select({
              productId: productVariants.productId,
              totalSold: sql<number>`SUM(${orderItems.quantity})::int`,
            })
            .from(orderItems)
            .innerJoin(orders, eq(orderItems.orderId, orders.id))
            .innerJoin(
              productVariants,
              eq(orderItems.variantId, productVariants.id),
            )
            .where(
              and(
                eq(orders.status, "paid"),
                gte(orders.createdAt, thirtyDaysAgo),
              ),
            )
            .groupBy(productVariants.productId)
            .orderBy(desc(sql`SUM(${orderItems.quantity})`))
            .limit(limit),
      )

      if (topSelling.length === 0) {
        // Fall back to featured products if no sales yet
        return getFeaturedProducts(limit)
      }

      const productIds = topSelling.map((p) => p.productId)

      const bestSellerProducts = await withStorefrontCatalogFallback(
        "storefront:getBestSellers:products",
        [],
        () =>
          db
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
                inArray(products.id, productIds),
              ),
            ),
      )

      const imageMap = await withStorefrontCatalogFallback(
        "storefront:getBestSellers:images",
        new Map<string, string>(),
        () => getPrimaryProductImageMap(productIds),
      )
      const salesMap = new Map(
        topSelling.map((product) => [product.productId, product.totalSold]),
      )

      // Sort by sales count
      return bestSellerProducts
        .map((product) => ({
          ...product,
          image: imageMap.get(product.id) || null,
          totalSold: salesMap.get(product.id) || 0,
        }))
        .sort((a, b) => b.totalSold - a.totalSold)
    },
    [`best-sellers-${limit}`],
    {
      revalidate: 1800, // Cache for 30 minutes
      tags: ["best-sellers", "orders"],
    },
  )()
}

// ============================================
// Get Featured Categories
// ============================================

export async function getFeaturedCategories(limit: number = 6) {
  return unstable_cache(
    async () => {
      const featuredCats = await withStorefrontCatalogFallback(
        "storefront:getFeaturedCategories:categories",
        [],
        () =>
          db
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
            .limit(limit),
      )

      const catIds = featuredCats.map((category) => category.id)
      const productCounts =
        catIds.length > 0
          ? await withStorefrontCatalogFallback(
              "storefront:getFeaturedCategories:counts",
              [] as Array<{ categoryId: string; count: number }>,
              () =>
                db
                  .select({
                    categoryId: productCategoryAssignments.categoryId,
                    count: sql<number>`count(*)::int`,
                  })
                  .from(productCategoryAssignments)
                  .innerJoin(
                    products,
                    eq(productCategoryAssignments.productId, products.id),
                  )
                  .where(
                    and(
                      eq(products.status, "active"),
                      inArray(productCategoryAssignments.categoryId, catIds),
                    ),
                  )
                  .groupBy(productCategoryAssignments.categoryId),
            )
          : []

      const countMap = new Map(
        productCounts.map((category) => [category.categoryId, category.count]),
      )

      return featuredCats.map((category) => ({
        ...category,
        productCount: countMap.get(category.id) || 0,
      }))
    },
    [`featured-categories-${limit}`],
    {
      revalidate: 3600, // Cache for 1 hour
      tags: ["categories", "products"],
    },
  )()
}

// ============================================
// Get Deal Products (Products with discount)
// ============================================

export async function getDealProducts(limit: number = 8) {
  return unstable_cache(
    async () => {
      const deals = await withStorefrontCatalogFallback(
        "storefront:getDealProducts:products",
        [],
        () =>
          db
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
            .limit(limit),
      )

      const imageMap = await withStorefrontCatalogFallback(
        "storefront:getDealProducts:images",
        new Map<string, string>(),
        () => getPrimaryProductImageMap(deals.map((product) => product.id)),
      )

      return deals.map((product) => ({
        ...product,
        image: imageMap.get(product.id) || null,
      }))
    },
    [`deal-products-${limit}`],
    {
      revalidate: 1800, // Cache for 30 minutes
      tags: ["deals", "products"],
    },
  )()
}

// ============================================
// Get Top Reviews (public storefront)
// ============================================

export async function getTopReviews(limit: number = 6) {
  return unstable_cache(
    async () => {
      const topReviews = await db
        .select({
          id: reviews.id,
          rating: reviews.rating,
          title: reviews.title,
          content: reviews.content,
          createdAt: reviews.createdAt,
          productName: products.name,
          productSlug: products.slug,
          userName: users.name,
          userImage: users.image,
        })
        .from(reviews)
        .innerJoin(products, eq(reviews.productId, products.id))
        .leftJoin(users, eq(reviews.userId, users.id))
        .where(and(eq(reviews.status, "approved"), gte(reviews.rating, 4)))
        .orderBy(desc(reviews.helpfulCount), desc(reviews.createdAt))
        .limit(limit)

      return topReviews
    },
    [`top-reviews-${limit}`],
    {
      revalidate: 3600,
      tags: ["reviews"],
    },
  )()
}
