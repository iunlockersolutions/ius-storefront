"use server"

import { revalidatePath } from "next/cache"

import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm"
import { z } from "zod"

import { getServerSession, requireStaff } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import {
  inventoryItems,
  inventoryMovements,
  products,
  productVariants,
} from "@/lib/db/schema"

// ============================================
// Get Inventory Overview Stats
// ============================================

export async function getInventoryStats() {
  await requireStaff()

  const [totalItems] = await db.select({ count: count() }).from(inventoryItems)

  const [lowStockItems] = await db
    .select({ count: count() })
    .from(inventoryItems)
    .where(
      sql`${inventoryItems.quantity} - ${inventoryItems.reservedQuantity} <= ${inventoryItems.lowStockThreshold}`,
    )

  const [outOfStockItems] = await db
    .select({ count: count() })
    .from(inventoryItems)
    .where(
      sql`${inventoryItems.quantity} - ${inventoryItems.reservedQuantity} <= 0`,
    )

  const [totalReserved] = await db
    .select({
      total: sql<number>`COALESCE(SUM(${inventoryItems.reservedQuantity}), 0)`,
    })
    .from(inventoryItems)

  return {
    totalItems: totalItems?.count || 0,
    lowStockItems: lowStockItems?.count || 0,
    outOfStockItems: outOfStockItems?.count || 0,
    totalReserved: totalReserved?.total || 0,
  }
}

// ============================================
// Get Inventory List
// ============================================

interface InventoryFilterInput {
  page?: number
  limit?: number
  search?: string
  stockStatus?: "all" | "low" | "out" | "normal"
}

export async function getInventoryItems(input: InventoryFilterInput = {}) {
  await requireStaff()

  const { page = 1, limit = 20, search, stockStatus = "all" } = input
  const offset = (page - 1) * limit

  // Build base query with joins
  let query = db
    .select({
      id: inventoryItems.id,
      variantId: inventoryItems.variantId,
      quantity: inventoryItems.quantity,
      reservedQuantity: inventoryItems.reservedQuantity,
      lowStockThreshold: inventoryItems.lowStockThreshold,
      updatedAt: inventoryItems.updatedAt,
      variantName: productVariants.name,
      variantSku: productVariants.sku,
      variantPrice: productVariants.price,
      productId: products.id,
      productName: products.name,
      productSlug: products.slug,
    })
    .from(inventoryItems)
    .innerJoin(
      productVariants,
      eq(inventoryItems.variantId, productVariants.id),
    )
    .innerJoin(products, eq(productVariants.productId, products.id))
    .$dynamic()

  // Apply search filter
  if (search) {
    query = query.where(
      or(
        ilike(productVariants.name, `%${search}%`),
        ilike(productVariants.sku, `%${search}%`),
        ilike(products.name, `%${search}%`),
      ),
    )
  }

  // Apply stock status filter
  if (stockStatus === "low") {
    query = query.where(
      and(
        sql`${inventoryItems.quantity} - ${inventoryItems.reservedQuantity} <= ${inventoryItems.lowStockThreshold}`,
        sql`${inventoryItems.quantity} - ${inventoryItems.reservedQuantity} > 0`,
      ),
    )
  } else if (stockStatus === "out") {
    query = query.where(
      sql`${inventoryItems.quantity} - ${inventoryItems.reservedQuantity} <= 0`,
    )
  } else if (stockStatus === "normal") {
    query = query.where(
      sql`${inventoryItems.quantity} - ${inventoryItems.reservedQuantity} > ${inventoryItems.lowStockThreshold}`,
    )
  }

  // Get total count
  const countQuery = db
    .select({ count: count() })
    .from(inventoryItems)
    .innerJoin(
      productVariants,
      eq(inventoryItems.variantId, productVariants.id),
    )
    .innerJoin(products, eq(productVariants.productId, products.id))

  const [totalResult] = await countQuery
  const total = totalResult?.count || 0

  // Get paginated items
  const items = await query
    .orderBy(desc(inventoryItems.updatedAt))
    .limit(limit)
    .offset(offset)

  // Calculate available quantity for each item
  const itemsWithAvailable = items.map((item) => ({
    ...item,
    availableQuantity: item.quantity - item.reservedQuantity,
    isLowStock:
      item.quantity - item.reservedQuantity <= (item.lowStockThreshold || 5),
    isOutOfStock: item.quantity - item.reservedQuantity <= 0,
  }))

  return {
    items: itemsWithAvailable,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

// ============================================
// Get Low Stock Alerts
// ============================================

export async function getLowStockAlerts(limit = 10) {
  await requireStaff()

  const items = await db
    .select({
      id: inventoryItems.id,
      variantId: inventoryItems.variantId,
      quantity: inventoryItems.quantity,
      reservedQuantity: inventoryItems.reservedQuantity,
      lowStockThreshold: inventoryItems.lowStockThreshold,
      variantName: productVariants.name,
      variantSku: productVariants.sku,
      productName: products.name,
      productSlug: products.slug,
    })
    .from(inventoryItems)
    .innerJoin(
      productVariants,
      eq(inventoryItems.variantId, productVariants.id),
    )
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(
      sql`${inventoryItems.quantity} - ${inventoryItems.reservedQuantity} <= ${inventoryItems.lowStockThreshold}`,
    )
    .orderBy(
      sql`${inventoryItems.quantity} - ${inventoryItems.reservedQuantity}`,
    )
    .limit(limit)

  return items.map((item) => ({
    ...item,
    availableQuantity: item.quantity - item.reservedQuantity,
    isOutOfStock: item.quantity - item.reservedQuantity <= 0,
  }))
}

// ============================================
// Adjust Stock
// ============================================

const adjustStockSchema = z.object({
  inventoryItemId: z.string().uuid(),
  adjustment: z.number().int(),
  reason: z.string().min(1, "Reason is required"),
})

export async function adjustStock(input: z.infer<typeof adjustStockSchema>) {
  await requireStaff()
  const session = await getServerSession()

  const validation = adjustStockSchema.safeParse(input)
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0]?.message }
  }

  const { inventoryItemId, adjustment, reason } = validation.data

  try {
    const result = await db.transaction(async (tx) => {
      // Get current inventory item
      const [item] = await tx
        .select()
        .from(inventoryItems)
        .where(eq(inventoryItems.id, inventoryItemId))
        .for("update")

      if (!item) {
        throw new Error("Inventory item not found")
      }

      const newQuantity = item.quantity + adjustment

      if (newQuantity < 0) {
        throw new Error("Cannot adjust stock below zero")
      }

      // Update inventory
      await tx
        .update(inventoryItems)
        .set({
          quantity: newQuantity,
          updatedAt: new Date(),
        })
        .where(eq(inventoryItems.id, inventoryItemId))

      // Record movement
      await tx.insert(inventoryMovements).values({
        inventoryItemId,
        type: "adjustment",
        quantity: adjustment,
        previousQuantity: item.quantity,
        newQuantity,
        referenceType: "manual_adjustment",
        notes: reason,
        performedBy: session?.user?.id || null,
      })

      return { previousQuantity: item.quantity, newQuantity }
    })

    revalidatePath("/admin/inventory")
    return { success: true, ...result }
  } catch (error) {
    console.error("Failed to adjust stock:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to adjust stock",
    }
  }
}

// ============================================
// Update Low Stock Threshold
// ============================================

export async function updateLowStockThreshold(
  inventoryItemId: string,
  threshold: number,
) {
  await requireStaff()

  if (threshold < 0) {
    return { success: false, error: "Threshold must be non-negative" }
  }

  try {
    await db
      .update(inventoryItems)
      .set({
        lowStockThreshold: threshold,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, inventoryItemId))

    revalidatePath("/admin/inventory")
    return { success: true }
  } catch (error) {
    console.error("Failed to update threshold:", error)
    return { success: false, error: "Failed to update threshold" }
  }
}

// ============================================
// Get Inventory Movement History
// ============================================

interface MovementHistoryInput {
  inventoryItemId?: string
  page?: number
  limit?: number
}

export async function getInventoryMovements(input: MovementHistoryInput = {}) {
  await requireStaff()

  const { inventoryItemId, page = 1, limit = 20 } = input
  const offset = (page - 1) * limit

  let query = db
    .select({
      id: inventoryMovements.id,
      type: inventoryMovements.type,
      quantity: inventoryMovements.quantity,
      previousQuantity: inventoryMovements.previousQuantity,
      newQuantity: inventoryMovements.newQuantity,
      referenceType: inventoryMovements.referenceType,
      referenceId: inventoryMovements.referenceId,
      notes: inventoryMovements.notes,
      createdAt: inventoryMovements.createdAt,
      inventoryItemId: inventoryMovements.inventoryItemId,
      variantName: productVariants.name,
      variantSku: productVariants.sku,
      productName: products.name,
    })
    .from(inventoryMovements)
    .innerJoin(
      inventoryItems,
      eq(inventoryMovements.inventoryItemId, inventoryItems.id),
    )
    .innerJoin(
      productVariants,
      eq(inventoryItems.variantId, productVariants.id),
    )
    .innerJoin(products, eq(productVariants.productId, products.id))
    .$dynamic()

  if (inventoryItemId) {
    query = query.where(eq(inventoryMovements.inventoryItemId, inventoryItemId))
  }

  const movements = await query
    .orderBy(desc(inventoryMovements.createdAt))
    .limit(limit)
    .offset(offset)

  // Get total count
  let countQuery = db
    .select({ count: count() })
    .from(inventoryMovements)
    .$dynamic()

  if (inventoryItemId) {
    countQuery = countQuery.where(
      eq(inventoryMovements.inventoryItemId, inventoryItemId),
    )
  }

  const [totalResult] = await countQuery
  const total = totalResult?.count || 0

  return {
    movements,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}
