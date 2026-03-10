"use server"

import { revalidatePath } from "next/cache"

import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm"
import { nanoid } from "nanoid"
import { z } from "zod"

import { requireResourcePermission } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import {
  brands,
  categories,
  inventoryItems,
  inventoryMovements,
  productCategoryAssignments,
  productImages,
  products,
  productVariants,
} from "@/lib/db/schema"
import {
  revalidateBrandCaches,
  revalidateCategoryCaches,
  revalidateProductCaches,
} from "@/lib/utils/cache"

import { withStorefrontCatalogFallback } from "./storefront-catalog-read"

const variantInputSchema = z.object({
  id: z.string().uuid().optional(),
  sku: z.string().min(1).max(100).optional(),
  name: z.string().min(1).max(255),
  price: z
    .string()
    .refine((val) => !Number.isNaN(parseFloat(val)) && parseFloat(val) >= 0),
  compareAtPrice: z.string().optional().nullable(),
  costPrice: z.string().optional().nullable(),
  weight: z.string().optional().nullable(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

const productMutationSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  brandId: z.string().uuid(),
  primaryCategoryId: z.string().uuid(),
  categoryIds: z.array(z.string().uuid()).default([]),
  basePrice: z
    .string()
    .refine((val) => !Number.isNaN(parseFloat(val)) && parseFloat(val) >= 0),
  compareAtPrice: z.string().optional().nullable(),
  costPrice: z.string().optional().nullable(),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  isFeatured: z.boolean().default(false),
  metaTitle: z.string().max(100).optional(),
  metaDescription: z.string().max(300).optional(),
  variants: z.array(variantInputSchema).min(1),
})

const createVariantSchema = z.object({
  productId: z.string().uuid(),
  sku: z.string().min(1).max(100).optional(),
  name: z.string().min(1).max(255),
  price: z
    .string()
    .refine((val) => !Number.isNaN(parseFloat(val)) && parseFloat(val) >= 0),
  compareAtPrice: z.string().optional().nullable(),
  costPrice: z.string().optional().nullable(),
  weight: z.string().optional().nullable(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  initialStock: z.number().int().min(0).default(0),
})

const updateStockSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int(),
  type: z.enum(["purchase", "adjustment", "damaged"]),
  notes: z.string().optional(),
})

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .concat("-", nanoid(6))
}

function generateSku(productName: string, variantName: string) {
  const prefix = productName.substring(0, 3).toUpperCase()
  const suffix = variantName.substring(0, 3).toUpperCase()
  return `${prefix}-${suffix}-${nanoid(6)}`.toUpperCase()
}

function createEmptyStorefrontProductsResult(page: number, limit: number) {
  return {
    products: [],
    total: 0,
    page,
    limit,
    totalPages: 0,
  }
}

function normalizeCategoryIds(
  primaryCategoryId: string,
  categoryIds: string[],
) {
  return Array.from(new Set([primaryCategoryId, ...categoryIds]))
}

function normalizeVariants(
  variants: z.infer<typeof variantInputSchema>[],
): z.infer<typeof variantInputSchema>[] {
  const prepared = variants.map((variant) => ({
    ...variant,
    compareAtPrice: variant.compareAtPrice || null,
    costPrice: variant.costPrice || null,
    weight: variant.weight || null,
  }))

  if (!prepared.some((variant) => variant.isDefault)) {
    prepared[0] = { ...prepared[0], isDefault: true }
  }

  let defaultAssigned = false
  return prepared.map((variant) => {
    if (variant.isDefault && !defaultAssigned) {
      defaultAssigned = true
      return variant
    }

    return {
      ...variant,
      isDefault: false,
    }
  })
}

async function getPrimaryImageMap(productIds: string[]) {
  if (productIds.length === 0) {
    return new Map<string, string>()
  }

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

  return new Map(images.map((image) => [image.productId, image.url]))
}

async function validateCatalogRefs(input: {
  brandId: string
  primaryCategoryId: string
  categoryIds: string[]
}) {
  const [brand] = await db
    .select({ id: brands.id })
    .from(brands)
    .where(eq(brands.id, input.brandId))
    .limit(1)

  if (!brand) {
    throw new Error("Brand not found")
  }

  const categoryIds = normalizeCategoryIds(
    input.primaryCategoryId,
    input.categoryIds,
  )

  const existingCategories = await db
    .select({ id: categories.id })
    .from(categories)
    .where(inArray(categories.id, categoryIds))

  if (existingCategories.length !== categoryIds.length) {
    throw new Error("One or more categories do not exist")
  }

  return categoryIds
}

async function ensureUniqueVariantSku(sku: string, currentVariantId?: string) {
  const [existing] = await db
    .select({ id: productVariants.id })
    .from(productVariants)
    .where(eq(productVariants.sku, sku))
    .limit(1)

  if (existing && existing.id !== currentVariantId) {
    throw new Error("A variant with this SKU already exists")
  }
}

async function syncProductCategories(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  productId: string,
  categoryIds: string[],
) {
  await tx
    .delete(productCategoryAssignments)
    .where(eq(productCategoryAssignments.productId, productId))

  if (categoryIds.length > 0) {
    await tx.insert(productCategoryAssignments).values(
      categoryIds.map((categoryId) => ({
        productId,
        categoryId,
      })),
    )
  }
}

async function syncProductVariants(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  productId: string,
  productName: string,
  variants: z.infer<typeof variantInputSchema>[],
) {
  const normalizedVariants = normalizeVariants(variants)
  const existingVariants = await tx
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, productId))

  const keepIds = normalizedVariants
    .map((variant) => variant.id)
    .filter((id): id is string => Boolean(id))

  for (let index = 0; index < normalizedVariants.length; index++) {
    const variant = normalizedVariants[index]
    const existing = variant.id
      ? existingVariants.find((current) => current.id === variant.id)
      : undefined
    const sku =
      variant.sku || existing?.sku || generateSku(productName, variant.name)

    await ensureUniqueVariantSku(sku, existing?.id)

    if (existing) {
      await tx
        .update(productVariants)
        .set({
          sku,
          name: variant.name,
          price: variant.price,
          compareAtPrice: variant.compareAtPrice || null,
          costPrice: variant.costPrice || null,
          weight: variant.weight || null,
          isDefault: variant.isDefault,
          isActive: variant.isActive,
          sortOrder: index,
          updatedAt: new Date(),
        })
        .where(eq(productVariants.id, existing.id))
    } else {
      const [createdVariant] = await tx
        .insert(productVariants)
        .values({
          productId,
          sku,
          name: variant.name,
          price: variant.price,
          compareAtPrice: variant.compareAtPrice || null,
          costPrice: variant.costPrice || null,
          weight: variant.weight || null,
          isDefault: variant.isDefault,
          isActive: variant.isActive,
          sortOrder: index,
        })
        .returning()

      // Maintain compatibility with the existing cart/PDP flow.
      await tx.insert(inventoryItems).values({
        variantId: createdVariant.id,
        quantity: 0,
        reservedQuantity: 0,
        lowStockThreshold: 5,
      })
    }
  }

  if (existingVariants.length > keepIds.length) {
    const deletableIds = existingVariants
      .filter((variant) => !keepIds.includes(variant.id))
      .map((variant) => variant.id)

    if (deletableIds.length > 0) {
      await tx
        .delete(productVariants)
        .where(inArray(productVariants.id, deletableIds))
    }
  }
}

async function getAssignedCategories(productId: string) {
  return db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      image: categories.image,
      metaTitle: categories.metaTitle,
      metaDescription: categories.metaDescription,
      parentId: categories.parentId,
      sortOrder: categories.sortOrder,
      isActive: categories.isActive,
      createdAt: categories.createdAt,
      updatedAt: categories.updatedAt,
    })
    .from(productCategoryAssignments)
    .innerJoin(
      categories,
      eq(productCategoryAssignments.categoryId, categories.id),
    )
    .where(eq(productCategoryAssignments.productId, productId))
    .orderBy(asc(categories.sortOrder), asc(categories.name))
}

export async function getProducts(options?: {
  page?: number
  limit?: number
  search?: string
  status?: string
  categoryId?: string
  brandId?: string
}) {
  const page = options?.page || 1
  const limit = options?.limit || 20
  const offset = (page - 1) * limit

  const conditions = []

  if (options?.search) {
    conditions.push(
      or(
        ilike(products.name, `%${options.search}%`),
        ilike(products.slug, `%${options.search}%`),
      )!,
    )
  }

  if (options?.status) {
    conditions.push(
      eq(products.status, options.status as "draft" | "active" | "archived"),
    )
  }

  if (options?.categoryId) {
    const productIds = await db
      .select({ productId: productCategoryAssignments.productId })
      .from(productCategoryAssignments)
      .where(eq(productCategoryAssignments.categoryId, options.categoryId))

    if (productIds.length === 0) {
      return {
        products: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      }
    }

    conditions.push(
      inArray(
        products.id,
        productIds.map((row) => row.productId),
      ),
    )
  }

  if (options?.brandId) {
    conditions.push(eq(products.brandId, options.brandId))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [productsList, countResult] = await Promise.all([
    db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        basePrice: products.basePrice,
        status: products.status,
        isFeatured: products.isFeatured,
        createdAt: products.createdAt,
        brandId: products.brandId,
        brandName: brands.name,
        primaryCategoryId: products.primaryCategoryId,
        primaryCategoryName: categories.name,
      })
      .from(products)
      .leftJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(categories, eq(products.primaryCategoryId, categories.id))
      .where(whereClause)
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(whereClause),
  ])

  return {
    products: productsList,
    total: Number(countResult[0]?.count || 0),
    page,
    limit,
    totalPages: Math.ceil(Number(countResult[0]?.count || 0) / limit),
  }
}

export async function getProduct(id: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1)

  if (!product) {
    return null
  }

  const [variants, images, brand, primaryCategory, assignedCategories] =
    await Promise.all([
      db
        .select()
        .from(productVariants)
        .where(eq(productVariants.productId, id))
        .orderBy(asc(productVariants.sortOrder)),
      db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, id))
        .orderBy(asc(productImages.sortOrder)),
      product.brandId
        ? db
            .select()
            .from(brands)
            .where(eq(brands.id, product.brandId))
            .limit(1)
        : Promise.resolve([]),
      product.primaryCategoryId
        ? db
            .select()
            .from(categories)
            .where(eq(categories.id, product.primaryCategoryId))
            .limit(1)
        : Promise.resolve([]),
      getAssignedCategories(id),
    ])

  const variantsWithInventory = await Promise.all(
    variants.map(async (variant) => {
      const [inventory] = await db
        .select()
        .from(inventoryItems)
        .where(eq(inventoryItems.variantId, variant.id))
        .limit(1)

      return {
        ...variant,
        inventory: inventory || null,
      }
    }),
  )

  const resolvedPrimaryCategory = primaryCategory[0] || null

  return {
    ...product,
    brand: brand[0] || null,
    primaryCategory: resolvedPrimaryCategory,
    category: resolvedPrimaryCategory,
    categories: assignedCategories,
    variants: variantsWithInventory,
    images,
  }
}

export async function getProductBySlug(slug: string) {
  return withStorefrontCatalogFallback(
    "products:getProductBySlug",
    null,
    async () => {
      const [product] = await db
        .select()
        .from(products)
        .where(and(eq(products.slug, slug), eq(products.status, "active")))
        .limit(1)

      if (!product) {
        return null
      }

      const [
        variants,
        images,
        brandRecords,
        primaryCategoryRecords,
        assignedCategories,
      ] = await Promise.all([
        withStorefrontCatalogFallback(
          "products:getProductBySlug:variants",
          [] as (typeof productVariants.$inferSelect)[],
          () =>
            db
              .select()
              .from(productVariants)
              .where(eq(productVariants.productId, product.id))
              .orderBy(asc(productVariants.sortOrder)),
        ),
        withStorefrontCatalogFallback(
          "products:getProductBySlug:images",
          [] as (typeof productImages.$inferSelect)[],
          () =>
            db
              .select()
              .from(productImages)
              .where(eq(productImages.productId, product.id))
              .orderBy(asc(productImages.sortOrder)),
        ),
        product.brandId
          ? withStorefrontCatalogFallback(
              "products:getProductBySlug:brand",
              [] as (typeof brands.$inferSelect)[],
              () =>
                db
                  .select()
                  .from(brands)
                  .where(eq(brands.id, product.brandId!))
                  .limit(1),
            )
          : Promise.resolve([] as (typeof brands.$inferSelect)[]),
        product.primaryCategoryId
          ? withStorefrontCatalogFallback(
              "products:getProductBySlug:primaryCategory",
              [] as (typeof categories.$inferSelect)[],
              () =>
                db
                  .select()
                  .from(categories)
                  .where(eq(categories.id, product.primaryCategoryId!))
                  .limit(1),
            )
          : Promise.resolve([] as (typeof categories.$inferSelect)[]),
        withStorefrontCatalogFallback(
          "products:getProductBySlug:categories",
          [] as Awaited<ReturnType<typeof getAssignedCategories>>,
          () => getAssignedCategories(product.id),
        ),
      ])

      const inventoryMap =
        variants.length > 0
          ? await withStorefrontCatalogFallback(
              "products:getProductBySlug:inventory",
              new Map<string, typeof inventoryItems.$inferSelect>(),
              async () => {
                const inventoryRows = await db
                  .select()
                  .from(inventoryItems)
                  .where(
                    inArray(
                      inventoryItems.variantId,
                      variants.map((variant) => variant.id),
                    ),
                  )

                return new Map(
                  inventoryRows.map((inventory) => [
                    inventory.variantId,
                    inventory,
                  ]),
                )
              },
            )
          : new Map<string, typeof inventoryItems.$inferSelect>()

      const resolvedPrimaryCategory = primaryCategoryRecords[0] || null

      return {
        ...product,
        brand: brandRecords[0] || null,
        primaryCategory: resolvedPrimaryCategory,
        category: resolvedPrimaryCategory,
        categories: assignedCategories,
        variants: variants.map((variant) => ({
          ...variant,
          inventory: inventoryMap.get(variant.id) || null,
        })),
        images,
      }
    },
  )
}

export async function getStorefrontProducts(options?: {
  page?: number
  limit?: number
  categorySlug?: string
  brandSlug?: string
  primaryCategoryId?: string
  search?: string
  sortBy?: "newest" | "price-low" | "price-high" | "name"
  featured?: boolean
}) {
  const page = options?.page || 1
  const limit = options?.limit || 12
  const offset = (page - 1) * limit

  return withStorefrontCatalogFallback(
    "products:getStorefrontProducts",
    () => createEmptyStorefrontProductsResult(page, limit),
    async () => {
      const conditions = [eq(products.status, "active")]

      if (options?.primaryCategoryId) {
        conditions.push(
          eq(products.primaryCategoryId, options.primaryCategoryId),
        )
      }

      if (options?.search) {
        conditions.push(
          or(
            ilike(products.name, `%${options.search}%`),
            ilike(products.shortDescription, `%${options.search}%`),
          )!,
        )
      }

      if (options?.featured) {
        conditions.push(eq(products.isFeatured, true))
      }

      if (options?.brandSlug) {
        const [brand] = await db
          .select({ id: brands.id })
          .from(brands)
          .where(
            and(eq(brands.slug, options.brandSlug), eq(brands.isActive, true)),
          )
          .limit(1)

        if (!brand) {
          return createEmptyStorefrontProductsResult(page, limit)
        }

        conditions.push(eq(products.brandId, brand.id))
      }

      if (options?.categorySlug) {
        const [category] = await db
          .select({ id: categories.id })
          .from(categories)
          .where(
            and(
              eq(categories.slug, options.categorySlug),
              eq(categories.isActive, true),
            ),
          )
          .limit(1)

        if (!category) {
          return createEmptyStorefrontProductsResult(page, limit)
        }

        const assignedRows = await db
          .select({ productId: productCategoryAssignments.productId })
          .from(productCategoryAssignments)
          .where(eq(productCategoryAssignments.categoryId, category.id))

        if (assignedRows.length === 0) {
          return createEmptyStorefrontProductsResult(page, limit)
        }

        conditions.push(
          inArray(
            products.id,
            assignedRows.map((row) => row.productId),
          ),
        )
      }

      const whereClause = and(...conditions)

      let orderBy
      switch (options?.sortBy) {
        case "price-low":
          orderBy = asc(products.basePrice)
          break
        case "price-high":
          orderBy = desc(products.basePrice)
          break
        case "name":
          orderBy = asc(products.name)
          break
        case "newest":
        default:
          orderBy = desc(products.createdAt)
      }

      const [productsList, countResult] = await Promise.all([
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
            brand: {
              id: brands.id,
              name: brands.name,
              slug: brands.slug,
            },
          })
          .from(products)
          .leftJoin(brands, eq(products.brandId, brands.id))
          .where(whereClause)
          .orderBy(orderBy)
          .limit(limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)` })
          .from(products)
          .where(whereClause),
      ])

      const imageMap = await withStorefrontCatalogFallback(
        "products:getStorefrontProducts:images",
        new Map<string, string>(),
        () => getPrimaryImageMap(productsList.map((product) => product.id)),
      )

      return {
        products: productsList.map((product) => ({
          ...product,
          image: imageMap.get(product.id) || null,
        })),
        total: Number(countResult[0]?.count || 0),
        page,
        limit,
        totalPages: Math.ceil(Number(countResult[0]?.count || 0) / limit),
      }
    },
  )
}

export async function createProduct(
  data: z.infer<typeof productMutationSchema>,
) {
  try {
    await requireResourcePermission("product", "create")
    const validated = productMutationSchema.parse(data)
    const slug = validated.slug || generateSlug(validated.name)

    const [existing] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1)

    if (existing) {
      return {
        success: false as const,
        error: "A product with this slug already exists",
      }
    }

    const categoryIds = await validateCatalogRefs(validated)

    const product = await db.transaction(async (tx) => {
      const [createdProduct] = await tx
        .insert(products)
        .values({
          name: validated.name,
          slug,
          description: validated.description,
          shortDescription: validated.shortDescription,
          brandId: validated.brandId,
          categoryId: validated.primaryCategoryId,
          primaryCategoryId: validated.primaryCategoryId,
          basePrice: validated.basePrice,
          compareAtPrice: validated.compareAtPrice || null,
          costPrice: validated.costPrice || null,
          status: validated.status,
          isFeatured: validated.isFeatured,
          metaTitle: validated.metaTitle,
          metaDescription: validated.metaDescription,
        })
        .returning()

      await syncProductCategories(tx, createdProduct.id, categoryIds)
      await syncProductVariants(
        tx,
        createdProduct.id,
        validated.name,
        validated.variants,
      )

      return createdProduct
    })

    revalidatePath("/ops/products")
    revalidateProductCaches()
    revalidateBrandCaches()
    revalidateCategoryCaches()
    return { success: true as const, data: product }
  } catch (error) {
    console.error("Failed to create product:", error)
    return {
      success: false as const,
      error:
        error instanceof Error ? error.message : "Failed to create product",
    }
  }
}

export async function updateProduct(
  id: string,
  data: z.infer<typeof productMutationSchema>,
) {
  await requireResourcePermission("product", "update")
  const validated = productMutationSchema.parse(data)

  const [existingProduct] = await db
    .select({ id: products.id, slug: products.slug })
    .from(products)
    .where(eq(products.id, id))
    .limit(1)

  if (!existingProduct) {
    throw new Error("Product not found")
  }

  if (validated.slug) {
    const [slugConflict] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, validated.slug))
      .limit(1)

    if (slugConflict && slugConflict.id !== id) {
      throw new Error("A product with this slug already exists")
    }
  }

  const categoryIds = await validateCatalogRefs(validated)

  const [updatedProduct] = await db.transaction(async (tx) => {
    const [product] = await tx
      .update(products)
      .set({
        name: validated.name,
        slug: validated.slug || existingProduct.slug,
        description: validated.description,
        shortDescription: validated.shortDescription,
        brandId: validated.brandId,
        categoryId: validated.primaryCategoryId,
        primaryCategoryId: validated.primaryCategoryId,
        basePrice: validated.basePrice,
        compareAtPrice: validated.compareAtPrice || null,
        costPrice: validated.costPrice || null,
        status: validated.status,
        isFeatured: validated.isFeatured,
        metaTitle: validated.metaTitle,
        metaDescription: validated.metaDescription,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning()

    await syncProductCategories(tx, id, categoryIds)
    await syncProductVariants(tx, id, validated.name, validated.variants)

    return [product]
  })

  revalidatePath("/ops/products")
  revalidatePath(`/ops/products/${id}`)
  revalidatePath(`/products/${updatedProduct.slug}`)
  revalidateProductCaches()
  revalidateBrandCaches()
  revalidateCategoryCaches()
  return updatedProduct
}

export async function deleteProduct(id: string) {
  await requireResourcePermission("product", "delete")

  await db.delete(products).where(eq(products.id, id))

  revalidatePath("/ops/products")
  revalidateProductCaches()
  revalidateBrandCaches()
  revalidateCategoryCaches()
  return { success: true }
}

export async function createVariant(data: z.infer<typeof createVariantSchema>) {
  const session = await requireResourcePermission("product", "update")
  const validated = createVariantSchema.parse(data)

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, validated.productId))
    .limit(1)

  if (!product) {
    throw new Error("Product not found")
  }

  const sku = validated.sku || generateSku(product.name, validated.name)
  await ensureUniqueVariantSku(sku)

  const [variant] = await db
    .insert(productVariants)
    .values({
      productId: validated.productId,
      sku,
      name: validated.name,
      price: validated.price,
      compareAtPrice: validated.compareAtPrice || null,
      costPrice: validated.costPrice || null,
      weight: validated.weight || null,
      isDefault: validated.isDefault,
      isActive: validated.isActive,
    })
    .returning()

  const [inventory] = await db
    .insert(inventoryItems)
    .values({
      variantId: variant.id,
      quantity: validated.initialStock,
    })
    .returning()

  if (validated.initialStock > 0) {
    await db.insert(inventoryMovements).values({
      inventoryItemId: inventory.id,
      type: "purchase",
      quantity: validated.initialStock,
      previousQuantity: 0,
      newQuantity: validated.initialStock,
      notes: "Initial stock",
      performedBy: session.user.id,
    })
  }

  revalidatePath(`/ops/products/${validated.productId}`)
  return variant
}

export async function updateStock(data: z.infer<typeof updateStockSchema>) {
  const session = await requireResourcePermission("inventory", "adjust")
  const validated = updateStockSchema.parse(data)

  const [inventory] = await db
    .select()
    .from(inventoryItems)
    .where(eq(inventoryItems.variantId, validated.variantId))
    .limit(1)

  if (!inventory) {
    throw new Error("Inventory not found")
  }

  const previousQuantity = inventory.quantity
  const newQuantity = previousQuantity + validated.quantity

  if (newQuantity < 0) {
    throw new Error("Cannot reduce stock below zero")
  }

  await db
    .update(inventoryItems)
    .set({
      quantity: newQuantity,
      updatedAt: new Date(),
    })
    .where(eq(inventoryItems.id, inventory.id))

  await db.insert(inventoryMovements).values({
    inventoryItemId: inventory.id,
    type: validated.type,
    quantity: validated.quantity,
    previousQuantity,
    newQuantity,
    notes: validated.notes,
    performedBy: session.user.id,
  })

  revalidatePath("/ops/inventory")
  return { success: true, newQuantity }
}

export async function addProductImages(
  productId: string,
  images: Array<{
    url: string
    altText?: string
    isPrimary?: boolean
  }>,
) {
  await requireResourcePermission("product", "update")

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1)

  if (!product) {
    return { success: false as const, error: "Product not found" }
  }

  const existingImages = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, productId))

  const sortOrder = existingImages.length

  if (images.some((image) => image.isPrimary)) {
    await db
      .update(productImages)
      .set({ isPrimary: false })
      .where(eq(productImages.productId, productId))
  }

  const newImages = await Promise.all(
    images.map(async (image, index) => {
      const [inserted] = await db
        .insert(productImages)
        .values({
          productId,
          url: image.url,
          altText: image.altText,
          isPrimary: image.isPrimary ?? (sortOrder === 0 && index === 0),
          sortOrder: sortOrder + index,
        })
        .returning()

      return inserted
    }),
  )

  revalidatePath(`/ops/products/${productId}`)
  revalidatePath(`/products/${product.slug}`)
  return { success: true as const, data: newImages }
}

export async function updateProductImages(
  productId: string,
  images: Array<{
    id?: string
    url: string
    altText?: string
    isPrimary?: boolean
  }>,
) {
  await requireResourcePermission("product", "update")

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1)

  if (!product) {
    return { success: false as const, error: "Product not found" }
  }

  const existingImages = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, productId))

  const newUrls = new Set(images.map((image) => image.url))
  const imagesToDelete = existingImages.filter(
    (image) => !newUrls.has(image.url),
  )

  for (const image of imagesToDelete) {
    await db.delete(productImages).where(eq(productImages.id, image.id))
  }

  if (images.some((image) => image.isPrimary)) {
    await db
      .update(productImages)
      .set({ isPrimary: false })
      .where(eq(productImages.productId, productId))
  }

  for (let index = 0; index < images.length; index++) {
    const image = images[index]
    const existing = existingImages.find((current) => current.url === image.url)

    if (existing) {
      await db
        .update(productImages)
        .set({
          altText: image.altText,
          isPrimary: image.isPrimary ?? false,
          sortOrder: index,
        })
        .where(eq(productImages.id, existing.id))
    } else {
      await db.insert(productImages).values({
        productId,
        url: image.url,
        altText: image.altText,
        isPrimary: image.isPrimary ?? false,
        sortOrder: index,
      })
    }
  }

  revalidatePath(`/ops/products/${productId}`)
  revalidatePath(`/products/${product.slug}`)
  return { success: true as const }
}

export async function deleteProductImage(imageId: string) {
  await requireResourcePermission("product", "update")

  const [image] = await db
    .select()
    .from(productImages)
    .where(eq(productImages.id, imageId))
    .limit(1)

  if (!image) {
    return { success: false as const, error: "Image not found" }
  }

  await db.delete(productImages).where(eq(productImages.id, imageId))

  if (image.isPrimary) {
    const [firstImage] = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, image.productId))
      .orderBy(asc(productImages.sortOrder))
      .limit(1)

    if (firstImage) {
      await db
        .update(productImages)
        .set({ isPrimary: true })
        .where(eq(productImages.id, firstImage.id))
    }
  }

  revalidatePath(`/ops/products/${image.productId}`)
  return { success: true as const }
}
