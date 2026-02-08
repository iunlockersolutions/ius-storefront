/**
 * Cache management utilities
 *
 * This file provides functions to invalidate cached data when updates occur.
 * Use revalidateTag() after mutations to ensure users see fresh data.
 */

import { revalidateTag } from "next/cache"

/**
 * Revalidate product-related caches
 * Call this after creating, updating, or deleting products
 */
export function revalidateProductCaches() {
  revalidateTag("products")
  revalidateTag("featured-products")
  revalidateTag("new-arrivals")
  revalidateTag("best-sellers")
  revalidateTag("deals")
}

/**
 * Revalidate category-related caches
 * Call this after creating, updating, or deleting categories
 */
export function revalidateCategoryCaches() {
  revalidateTag("categories")
}

/**
 * Revalidate order-related caches
 * Call this after creating new orders (affects best sellers)
 */
export function revalidateOrderCaches() {
  revalidateTag("orders")
  revalidateTag("best-sellers")
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
