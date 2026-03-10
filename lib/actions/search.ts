"use server"

import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm"

import { db } from "@/lib/db"
import {
  brands,
  categories,
  productCategoryAssignments,
  productImages,
  products,
} from "@/lib/db/schema"

import { withStorefrontCatalogFallback } from "./storefront-catalog-read"

interface SearchParams {
  query: string
  category?: string
  brand?: string
  minPrice?: number
  maxPrice?: number
  sort?: "relevance" | "price-asc" | "price-desc" | "newest"
  page?: number
  limit?: number
}

export async function searchProducts(params: SearchParams) {
  const {
    query,
    category,
    brand,
    minPrice,
    maxPrice,
    sort = "relevance",
    page = 1,
    limit = 12,
  } = params

  const offset = (page - 1) * limit

  return withStorefrontCatalogFallback(
    "search:searchProducts",
    {
      products: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    },
    async () => {
      const conditions = [eq(products.status, "active")]

      if (query) {
        conditions.push(
          or(
            ilike(products.name, `%${query}%`),
            ilike(products.description, `%${query}%`),
            ilike(products.shortDescription, `%${query}%`),
            ilike(brands.name, `%${query}%`),
          )!,
        )
      }

      if (brand) {
        const [brandRecord] = await db
          .select({ id: brands.id })
          .from(brands)
          .where(and(eq(brands.slug, brand), eq(brands.isActive, true)))
          .limit(1)

        if (!brandRecord) {
          return {
            products: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0,
            },
          }
        }

        conditions.push(eq(products.brandId, brandRecord.id))
      }

      if (category) {
        const [categoryRecord] = await db
          .select({ id: categories.id })
          .from(categories)
          .where(
            and(eq(categories.slug, category), eq(categories.isActive, true)),
          )
          .limit(1)

        if (!categoryRecord) {
          return {
            products: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0,
            },
          }
        }

        const assignments = await db
          .select({ productId: productCategoryAssignments.productId })
          .from(productCategoryAssignments)
          .where(eq(productCategoryAssignments.categoryId, categoryRecord.id))

        if (assignments.length === 0) {
          return {
            products: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0,
            },
          }
        }

        conditions.push(
          inArray(
            products.id,
            assignments.map((assignment) => assignment.productId),
          ),
        )
      }

      if (minPrice !== undefined) {
        conditions.push(sql`${products.basePrice}::numeric >= ${minPrice}`)
      }

      if (maxPrice !== undefined) {
        conditions.push(sql`${products.basePrice}::numeric <= ${maxPrice}`)
      }

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
          orderByClause = desc(products.isFeatured)
          break
      }

      const whereClause = and(...conditions)

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(products)
        .leftJoin(brands, eq(products.brandId, brands.id))
        .where(whereClause)

      const searchResults = await db
        .select({
          id: products.id,
          name: products.name,
          slug: products.slug,
          shortDescription: products.shortDescription,
          basePrice: products.basePrice,
          compareAtPrice: products.compareAtPrice,
          isFeatured: products.isFeatured,
          brand: {
            id: brands.id,
            name: brands.name,
            slug: brands.slug,
          },
        })
        .from(products)
        .leftJoin(brands, eq(products.brandId, brands.id))
        .where(whereClause)
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset)

      const imageMap = await withStorefrontCatalogFallback(
        "search:searchProducts:images",
        new Map<string, string>(),
        async () => {
          const productIds = searchResults.map((product) => product.id)
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

          return new Map(images.map((image) => [image.productId, image.url]))
        },
      )

      return {
        products: searchResults.map((product) => ({
          ...product,
          image: imageMap.get(product.id) || null,
        })),
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      }
    },
  )
}

export async function getSearchSuggestions(query: string, limit = 5) {
  if (!query || query.length < 2) {
    return { products: [], categories: [], brands: [] }
  }

  const [productSuggestions, categorySuggestions, brandSuggestions] =
    await Promise.all([
      withStorefrontCatalogFallback(
        "search:getSearchSuggestions:products",
        [],
        () =>
          db
            .select({
              id: products.id,
              name: products.name,
              slug: products.slug,
            })
            .from(products)
            .where(
              and(
                eq(products.status, "active"),
                ilike(products.name, `%${query}%`),
              ),
            )
            .limit(limit),
      ),
      withStorefrontCatalogFallback(
        "search:getSearchSuggestions:categories",
        [],
        () =>
          db
            .select({
              id: categories.id,
              name: categories.name,
              slug: categories.slug,
            })
            .from(categories)
            .where(
              and(
                eq(categories.isActive, true),
                ilike(categories.name, `%${query}%`),
              ),
            )
            .limit(3),
      ),
      withStorefrontCatalogFallback(
        "search:getSearchSuggestions:brands",
        [],
        () =>
          db
            .select({
              id: brands.id,
              name: brands.name,
              slug: brands.slug,
            })
            .from(brands)
            .where(
              and(eq(brands.isActive, true), ilike(brands.name, `%${query}%`)),
            )
            .limit(3),
      ),
    ])

  return {
    products: productSuggestions,
    categories: categorySuggestions,
    brands: brandSuggestions,
  }
}

export async function getPopularSearchTerms() {
  return ["iPhone", "Samsung", "Accessories", "Sony", "Chargers", "Cases"]
}
