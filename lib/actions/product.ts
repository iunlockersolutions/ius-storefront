"use server"

import { revalidatePath } from "next/cache"

import { and, asc, desc, eq, ilike, sql } from "drizzle-orm"
import { nanoid } from "nanoid"
import { z } from "zod"

import { requirePermission } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import {
  categories,
  inventoryItems,
  inventoryMovements,
  productImages,
  products,
  productVariants,
} from "@/lib/db/schema"
import { revalidateProductCaches } from "@/lib/utils/cache"

// Schema for creating a product
const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  categoryId: z.string().uuid().optional().nullable(),
  basePrice: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0),
  compareAtPrice: z.string().optional().nullable(),
  costPrice: z.string().optional().nullable(),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  isFeatured: z.boolean().default(false),
  metaTitle: z.string().max(100).optional(),
  metaDescription: z.string().max(300).optional(),
})

// Schema for creating a product variant
const createVariantSchema = z.object({
  productId: z.string().uuid(),
  sku: z.string().min(1).max(100).optional(),
  name: z.string().min(1).max(255),
  price: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0),
  compareAtPrice: z.string().optional().nullable(),
  costPrice: z.string().optional().nullable(),
  weight: z.string().optional().nullable(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  initialStock: z.number().int().min(0).default(0),
})

// Schema for updating stock
const updateStockSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int(),
  type: z.enum(["purchase", "adjustment", "damaged"]),
  notes: z.string().optional(),
})

/**
 * Generate a URL-friendly slug from a string
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .concat("-", nanoid(6))
}

/**
 * Generate a SKU for a variant
 */
function generateSku(productName: string, variantName: string): string {
  const prefix = productName.substring(0, 3).toUpperCase()
  const suffix = variantName.substring(0, 3).toUpperCase()
  return `${prefix}-${suffix}-${nanoid(6)}`.toUpperCase()
}

/**
 * Get all products with pagination and filtering
 */
export async function getProducts(options?: {
  page?: number
  limit?: number
  search?: string
  status?: string
  categoryId?: string
}) {
  const page = options?.page || 1
  const limit = options?.limit || 20
  const offset = (page - 1) * limit

  const conditions = []

  if (options?.search) {
    conditions.push(ilike(products.name, `%${options.search}%`))
  }

  if (options?.status) {
    conditions.push(
      eq(products.status, options.status as "draft" | "active" | "archived"),
    )
  }

  if (options?.categoryId) {
    conditions.push(eq(products.categoryId, options.categoryId))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [productsList, countResult] = await Promise.all([
    db
      .select()
      .from(products)
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

/**
 * Get a single product by ID with variants and images
 */
export async function getProduct(id: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1)

  if (!product) {
    return null
  }

  const [variants, images, category] = await Promise.all([
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
    product.categoryId
      ? db
          .select()
          .from(categories)
          .where(eq(categories.id, product.categoryId))
          .limit(1)
      : Promise.resolve([]),
  ])

  // Get inventory for each variant
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

  return {
    ...product,
    variants: variantsWithInventory,
    images,
    category: category[0] || null,
  }
}

/**
 * Get a product by slug (for storefront)
 */
export async function getProductBySlug(slug: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.status, "active")))
    .limit(1)

  if (!product) {
    return null
  }

  return getProduct(product.id)
}

/**
 * Get products for storefront with filtering and pagination
 */
export async function getStorefrontProducts(options?: {
  page?: number
  limit?: number
  categoryId?: string
  search?: string
  sortBy?: "newest" | "price-low" | "price-high" | "name"
  featured?: boolean
}) {
  const page = options?.page || 1
  const limit = options?.limit || 12
  const offset = (page - 1) * limit

  const conditions = [eq(products.status, "active")]

  if (options?.categoryId) {
    conditions.push(eq(products.categoryId, options.categoryId))
  }

  if (options?.search) {
    conditions.push(ilike(products.name, `%${options.search}%`))
  }

  if (options?.featured) {
    conditions.push(eq(products.isFeatured, true))
  }

  const whereClause = and(...conditions)

  // Determine sort order
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
      })
      .from(products)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(whereClause),
  ])

  // Get primary image for each product
  const productsWithImages = await Promise.all(
    productsList.map(async (product) => {
      const [image] = await db
        .select()
        .from(productImages)
        .where(
          and(
            eq(productImages.productId, product.id),
            eq(productImages.isPrimary, true),
          ),
        )
        .limit(1)

      return {
        ...product,
        image: image?.url || null,
      }
    }),
  )

  return {
    products: productsWithImages,
    total: Number(countResult[0]?.count || 0),
    page,
    limit,
    totalPages: Math.ceil(Number(countResult[0]?.count || 0) / limit),
  }
}

/**
 * Create a new product (Admin/Manager only)
 */
export async function createProduct(data: z.infer<typeof createProductSchema>) {
  try {
    const session = await requirePermission("product.write")
    const validated = createProductSchema.parse(data)

    const slug = validated.slug || generateSlug(validated.name)

    // Check for duplicate slug
    const existing = await db
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1)

    if (existing.length > 0) {
      return {
        success: false as const,
        error: "A product with this slug already exists",
      }
    }

    const [product] = await db
      .insert(products)
      .values({
        name: validated.name,
        slug,
        description: validated.description,
        shortDescription: validated.shortDescription,
        categoryId: validated.categoryId,
        basePrice: validated.basePrice,
        compareAtPrice: validated.compareAtPrice,
        costPrice: validated.costPrice,
        status: validated.status,
        isFeatured: validated.isFeatured,
        metaTitle: validated.metaTitle,
        metaDescription: validated.metaDescription,
      })
      .returning()

    revalidatePath("/admin/products")
    revalidateProductCaches() // Invalidate cached product data
    return { success: true as const, data: product }
  } catch (error) {
    console.error("Failed to create product:", error)
    return { success: false as const, error: "Failed to create product" }
  }
}

/**
 * Update a product (Admin/Manager only)
 */
export async function updateProduct(
  id: string,
  data: Partial<z.infer<typeof createProductSchema>>,
) {
  await requirePermission("product.write")

  const [product] = await db
    .update(products)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id))
    .returning()

  revalidatePath("/admin/products")
  revalidatePath(`/admin/products/${id}`)
  revalidatePath(`/products/${product.slug}`)
  revalidateProductCaches() // Invalidate cached product data
  return product
}

/**
 * Delete a product (Admin only)
 */
export async function deleteProduct(id: string) {
  await requirePermission("product.delete")

  await db.delete(products).where(eq(products.id, id))

  revalidatePath("/admin/products")
  revalidateProductCaches() // Invalidate cached product data
  return { success: true }
}

/**
 * Create a product variant (Admin/Manager only)
 */
export async function createVariant(data: z.infer<typeof createVariantSchema>) {
  const session = await requirePermission("product.write")
  const validated = createVariantSchema.parse(data)

  // Get the product for SKU generation
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, validated.productId))
    .limit(1)

  if (!product) {
    throw new Error("Product not found")
  }

  const sku = validated.sku || generateSku(product.name, validated.name)

  // Check for duplicate SKU
  const existingSku = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.sku, sku))
    .limit(1)

  if (existingSku.length > 0) {
    throw new Error("A variant with this SKU already exists")
  }

  // Create variant
  const [variant] = await db
    .insert(productVariants)
    .values({
      productId: validated.productId,
      sku,
      name: validated.name,
      price: validated.price,
      compareAtPrice: validated.compareAtPrice,
      costPrice: validated.costPrice,
      weight: validated.weight,
      isDefault: validated.isDefault,
      isActive: validated.isActive,
    })
    .returning()

  // Create inventory item
  const [inventory] = await db
    .insert(inventoryItems)
    .values({
      variantId: variant.id,
      quantity: validated.initialStock,
    })
    .returning()

  // Create initial inventory movement if stock > 0
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

  revalidatePath(`/admin/products/${validated.productId}`)
  return variant
}

/**
 * Update stock for a variant (Admin/Manager only)
 */
export async function updateStock(data: z.infer<typeof updateStockSchema>) {
  const session = await requirePermission("inventory.write")
  const validated = updateStockSchema.parse(data)

  // Get current inventory
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

  // Update inventory
  await db
    .update(inventoryItems)
    .set({
      quantity: newQuantity,
      updatedAt: new Date(),
    })
    .where(eq(inventoryItems.id, inventory.id))

  // Create movement record
  await db.insert(inventoryMovements).values({
    inventoryItemId: inventory.id,
    type: validated.type,
    quantity: validated.quantity,
    previousQuantity,
    newQuantity,
    notes: validated.notes,
    performedBy: session.user.id,
  })

  revalidatePath("/admin/inventory")
  return { success: true, newQuantity }
}

// Schema for adding product images
const addImageSchema = z.object({
  productId: z.string().uuid(),
  url: z.string().url(),
  altText: z.string().max(255).optional(),
  isPrimary: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
})

/**
 * Add images to a product (Admin/Manager only)
 */
export async function addProductImages(
  productId: string,
  images: Array<{
    url: string
    altText?: string
    isPrimary?: boolean
  }>,
) {
  await requirePermission("product.write")

  // Verify product exists
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1)

  if (!product) {
    return { success: false as const, error: "Product not found" }
  }

  // Get existing images count for sort order
  const existingImages = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, productId))

  const sortOrder = existingImages.length

  // If any image is set as primary, remove primary from others
  const hasPrimary = images.some((img) => img.isPrimary)
  if (hasPrimary) {
    await db
      .update(productImages)
      .set({ isPrimary: false })
      .where(eq(productImages.productId, productId))
  }

  // Add new images
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

  revalidatePath(`/admin/products/${productId}`)
  revalidatePath(`/products/${product.slug}`)
  return { success: true as const, data: newImages }
}

/**
 * Update product images (replace all images)
 */
export async function updateProductImages(
  productId: string,
  images: Array<{
    id?: string
    url: string
    altText?: string
    isPrimary?: boolean
  }>,
) {
  await requirePermission("product.write")

  // Verify product exists
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1)

  if (!product) {
    return { success: false as const, error: "Product not found" }
  }

  // Get existing images
  const existingImages = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, productId))

  const existingUrls = new Set(existingImages.map((img) => img.url))
  const newUrls = new Set(images.map((img) => img.url))

  // Delete images that are no longer present
  const imagesToDelete = existingImages.filter((img) => !newUrls.has(img.url))
  for (const img of imagesToDelete) {
    await db.delete(productImages).where(eq(productImages.id, img.id))
  }

  // Update or insert images
  for (let i = 0; i < images.length; i++) {
    const image = images[i]
    const existing = existingImages.find((e) => e.url === image.url)

    if (existing) {
      // Update existing image
      await db
        .update(productImages)
        .set({
          altText: image.altText,
          isPrimary: image.isPrimary ?? false,
          sortOrder: i,
        })
        .where(eq(productImages.id, existing.id))
    } else {
      // Insert new image
      await db.insert(productImages).values({
        productId,
        url: image.url,
        altText: image.altText,
        isPrimary: image.isPrimary ?? false,
        sortOrder: i,
      })
    }
  }

  revalidatePath(`/admin/products/${productId}`)
  revalidatePath(`/products/${product.slug}`)
  return { success: true as const }
}

/**
 * Delete a product image
 */
export async function deleteProductImage(imageId: string) {
  await requirePermission("product.write")

  const [image] = await db
    .select()
    .from(productImages)
    .where(eq(productImages.id, imageId))
    .limit(1)

  if (!image) {
    return { success: false as const, error: "Image not found" }
  }

  await db.delete(productImages).where(eq(productImages.id, imageId))

  // If this was the primary image, make the first remaining image primary
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

  revalidatePath(`/admin/products/${image.productId}`)
  return { success: true as const }
}
