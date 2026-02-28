/**
 * Cache management utilities
 *
 * This file provides functions to invalidate cached data when updates occur.
 * Use revalidateTag() after mutations to ensure users see fresh data.
 */

import { revalidateTag } from "next/cache"

function revalidateStorefrontTag(tag: string) {
  revalidateTag(tag, "max")
}

/**
 * Revalidate product-related caches
 * Call this after creating, updating, or deleting products
 */
export function revalidateProductCaches() {
  revalidateStorefrontTag("products")
  revalidateStorefrontTag("featured-products")
  revalidateStorefrontTag("new-arrivals")
  revalidateStorefrontTag("best-sellers")
  revalidateStorefrontTag("deals")
}

/**
 * Revalidate category-related caches
 * Call this after creating, updating, or deleting categories
 */
export function revalidateCategoryCaches() {
  revalidateStorefrontTag("categories")
}

/**
 * Revalidate order-related caches
 * Call this after creating new orders (affects best sellers)
 */
export function revalidateOrderCaches() {
  revalidateStorefrontTag("orders")
  revalidateStorefrontTag("best-sellers")
}

/**
 * Revalidate all storefront caches
 * Use sparingly - only when major changes affect entire site
 */
export function revalidateAllStorefrontCaches() {
  revalidateProductCaches()
  revalidateCategoryCaches()
  revalidateOrderCaches()
}
