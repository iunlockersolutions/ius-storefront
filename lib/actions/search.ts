"use server"

import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm"

import { db } from "@/lib/db"
import { categories, productImages, products } from "@/lib/db/schema"

interface SearchParams {
  query: string
  category?: string
  minPrice?: number
  maxPrice?: number
  sort?: "relevance" | "price-asc" | "price-desc" | "newest"
  page?: number
  limit?: number
}

// ============================================
// Search Products
// ============================================

export async function searchProducts(params: SearchParams) {
  const {
    query,
    category,
    minPrice,
    maxPrice,
    sort = "relevance",
    page = 1,
    limit = 12,
  } = params

  const offset = (page - 1) * limit

  // Build where conditions
  const conditions = [eq(products.status, "active")]

  // Search in name, description, short description
  if (query) {
    conditions.push(
      or(
        ilike(products.name, `%${query}%`),
        ilike(products.description, `%${query}%`),
        ilike(products.shortDescription, `%${query}%`),
      )!,
    )
  }

  // Category filter
  if (category) {
    const cat = await db.query.categories.findFirst({
      where: eq(categories.slug, category),
    })
    if (cat) {
      conditions.push(eq(products.categoryId, cat.id))
    }
  }

  // Price filters
  if (minPrice !== undefined) {
    conditions.push(sql`${products.basePrice}::numeric >= ${minPrice}`)
  }
  if (maxPrice !== undefined) {
    conditions.push(sql`${products.basePrice}::numeric <= ${maxPrice}`)
  }

  // Build order by
  let orderByClause
  switch (sort) {
    case "price-asc":
      orderByClause = asc(sql`${products.basePrice}::numeric`)
      break
    case "price-desc":
      orderByClause = desc(sql`${products.basePrice}::numeric`)
      break
    case "newest":
      orderByClause = desc(products.createdAt)
      break
    case "relevance":
    default:
      // For relevance, prioritize exact matches, then featured products
      orderByClause = desc(products.isFeatured)
      break
  }

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .where(and(...conditions))

  // Get products
  const searchResults = await db
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
    .where(and(...conditions))
    .orderBy(orderByClause)
    .limit(limit)
    .offset(offset)

  // Get primary images
  const productIds = searchResults.map((p) => p.id)
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

  const productsWithImages = searchResults.map((p) => ({
    ...p,
    image: imageMap.get(p.id) || null,
  }))

  return {
    products: productsWithImages,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  }
}

// ============================================
// Search Suggestions (Autocomplete)
// ============================================

export async function getSearchSuggestions(query: string, limit: number = 5) {
  if (!query || query.length < 2) {
    return { products: [], categories: [] }
  }

  const suggestions = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
    })
    .from(products)
    .where(
      and(eq(products.status, "active"), ilike(products.name, `%${query}%`)),
    )
    .limit(limit)

  // Also get matching categories
  const categorySuggestions = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
    })
    .from(categories)
    .where(
      and(eq(categories.isActive, true), ilike(categories.name, `%${query}%`)),
    )
    .limit(3)

  return {
    products: suggestions,
    categories: categorySuggestions,
  }
}

// ============================================
// Get Popular Search Terms
// ============================================

export async function getPopularSearchTerms() {
  // For now, return static popular terms
  // In production, you'd track search queries in a table
  return [
    "iPhone",
    "Samsung",
    "Accessories",
    "Charger",
    "Case",
    "Screen Protector",
  ]
}
