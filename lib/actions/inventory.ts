"use server"

import { and, asc, desc, eq, ilike, inArray, or } from "drizzle-orm"
import { z } from "zod"

import { getServerSession } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import {
  inventoryLevels,
  inventoryTransactions,
  inventoryUnitIdentifiers,
  inventoryUnits,
  products,
  productVariants,
  user,
} from "@/lib/db/schema"
import {
  normalizeReceiptIdentifierTypes,
  type ReceiptIdentifierType,
  sanitizeReceiptIdentifierTypes,
} from "@/lib/inventory/identifier-template"
import type {
  AdminInventoryDetail,
  AdminInventoryIdentifierType,
  AdminInventoryListItem,
  AdminInventoryListResponse,
  AdminInventoryLowStockAlert,
  AdminInventoryMovementResponse,
  AdminInventorySortField,
  AdminInventorySortOrder,
  AdminInventoryStats,
  AdminInventoryTrackingMode,
  AdminInventoryTransactionType,
  AdminInventoryUnitStatus,
  AdminProductReceiveStockContext,
} from "@/lib/types/admin-inventory"

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]
type DbClient = typeof db | DbTransaction

const inventoryStatusSchema = z.enum(["all", "low", "out", "normal"])
const inventoryIdentifierTypeSchema = z.enum([
  "serial",
  "imei",
  "imei2",
  "barcode",
])

const inventoryListInputSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  search: z.string().trim().default(""),
  stockStatus: inventoryStatusSchema.default("all"),
  sortBy: z
    .enum([
      "product",
      "sku",
      "available",
      "reserved",
      "allocated",
      "onHand",
      "status",
      "updated",
    ])
    .default("updated"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
})

const stockAdjustmentSchema = z.object({
  variantId: z.string().uuid(),
  adjustment: z
    .number()
    .int()
    .refine((value) => value !== 0),
  reason: z.string().trim().min(1),
})

const inventoryReceiptSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().positive().optional(),
  notes: z.string().trim().optional(),
  identifierTemplate: z.array(inventoryIdentifierTypeSchema).optional(),
  units: z
    .array(
      z.object({
        notes: z.string().trim().optional(),
        identifiers: z
          .array(
            z.object({
              type: inventoryIdentifierTypeSchema,
              value: z.string().trim().min(1),
            }),
          )
          .min(1),
      }),
    )
    .optional(),
})

const lowStockThresholdSchema = z.object({
  variantId: z.string().uuid(),
  threshold: z.number().int().min(0),
})

const transactionQuantitySchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().positive(),
  referenceType: z.string().trim().optional(),
  referenceId: z.string().uuid().optional(),
  notes: z.string().trim().optional(),
  unitIds: z.array(z.string().uuid()).optional(),
})

interface InventoryVariantContext {
  variantId: string
  variantName: string
  variantSku: string
  productId: string
  productName: string
  productSlug: string
  trackingMode: AdminInventoryTrackingMode
  manageInventory: boolean
  receiptIdentifierTypes: AdminInventoryIdentifierType[]
}

interface InventoryLevelSnapshot {
  id: string
  variantId: string
  onHandQuantity: number
  availableQuantity: number
  reservedQuantity: number
  allocatedQuantity: number
  lowStockThreshold: number
}

interface InventoryMutationOptions {
  tx?: DbClient
}

function normalizeIdentifierValue(value: string) {
  return value.trim().toLowerCase()
}

function resolveReceiptIdentifierTemplate(
  variant: InventoryVariantContext,
  overrideTemplate?: AdminInventoryIdentifierType[],
) {
  if (variant.trackingMode !== "serial") {
    return [] as ReceiptIdentifierType[]
  }

  const template = sanitizeReceiptIdentifierTypes({
    manageInventory: variant.manageInventory,
    trackingMode: variant.trackingMode,
    values: overrideTemplate ?? variant.receiptIdentifierTypes,
  })

  if (template.length === 0) {
    throw new Error(
      "Serialized variants require at least one configured receipt identifier type",
    )
  }

  return template
}

function validateReceivedUnitIdentifiers(
  units: NonNullable<z.infer<typeof inventoryReceiptSchema>["units"]>,
  requiredTypes: ReceiptIdentifierType[],
) {
  for (const unit of units) {
    const actualTypes = normalizeReceiptIdentifierTypes(
      unit.identifiers.map((identifier) => identifier.type),
    )

    if (actualTypes.length !== unit.identifiers.length) {
      throw new Error(
        "Each received unit can include each identifier type only once",
      )
    }

    if (
      actualTypes.length !== requiredTypes.length ||
      actualTypes.some((type, index) => type !== requiredTypes[index])
    ) {
      throw new Error(
        `Serialized receipt units must include exactly: ${requiredTypes
          .map((type) => type.toUpperCase())
          .join(", ")}`,
      )
    }
  }
}

async function getActorUserId() {
  try {
    const session = await getServerSession()
    return session?.user?.id ?? null
  } catch {
    return null
  }
}

async function getVariantContext(
  tx: DbClient,
  variantId: string,
): Promise<InventoryVariantContext> {
  const [variant] = await tx
    .select({
      variantId: productVariants.id,
      variantName: productVariants.name,
      variantSku: productVariants.sku,
      productId: products.id,
      productName: products.name,
      productSlug: products.slug,
      trackingMode: products.inventoryTrackingMode,
      manageInventory: productVariants.manageInventory,
      receiptIdentifierTypes: products.receiptIdentifierTypes,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(eq(productVariants.id, variantId))
    .limit(1)

  if (!variant) {
    throw new Error("Inventory variant not found")
  }

  return variant
}

async function getOrCreateLevel(tx: DbClient, variantId: string) {
  const [existingLevel] = await tx
    .select({
      id: inventoryLevels.id,
      variantId: inventoryLevels.variantId,
      onHandQuantity: inventoryLevels.onHandQuantity,
      availableQuantity: inventoryLevels.availableQuantity,
      reservedQuantity: inventoryLevels.reservedQuantity,
      allocatedQuantity: inventoryLevels.allocatedQuantity,
      lowStockThreshold: inventoryLevels.lowStockThreshold,
    })
    .from(inventoryLevels)
    .where(eq(inventoryLevels.variantId, variantId))
    .limit(1)
    .for("update")

  if (existingLevel) {
    return existingLevel
  }

  const [createdLevel] = await tx
    .insert(inventoryLevels)
    .values({
      variantId,
      onHandQuantity: 0,
      availableQuantity: 0,
      reservedQuantity: 0,
      allocatedQuantity: 0,
      lowStockThreshold: 5,
    })
    .returning({
      id: inventoryLevels.id,
      variantId: inventoryLevels.variantId,
      onHandQuantity: inventoryLevels.onHandQuantity,
      availableQuantity: inventoryLevels.availableQuantity,
      reservedQuantity: inventoryLevels.reservedQuantity,
      allocatedQuantity: inventoryLevels.allocatedQuantity,
      lowStockThreshold: inventoryLevels.lowStockThreshold,
    })

  return createdLevel
}

function ensureManagedInventory(variant: InventoryVariantContext) {
  if (!variant.manageInventory) {
    throw new Error("Inventory is disabled for this variant")
  }
}

function toSnapshot(level: {
  id: string
  variantId: string
  onHandQuantity: number
  availableQuantity: number
  reservedQuantity: number
  allocatedQuantity: number
  lowStockThreshold: number
}): InventoryLevelSnapshot {
  return {
    id: level.id,
    variantId: level.variantId,
    onHandQuantity: level.onHandQuantity,
    availableQuantity: level.availableQuantity,
    reservedQuantity: level.reservedQuantity,
    allocatedQuantity: level.allocatedQuantity,
    lowStockThreshold: level.lowStockThreshold,
  }
}

async function updateLevelSnapshot(
  tx: DbClient,
  levelId: string,
  next: Pick<
    InventoryLevelSnapshot,
    | "onHandQuantity"
    | "availableQuantity"
    | "reservedQuantity"
    | "allocatedQuantity"
    | "lowStockThreshold"
  >,
) {
  const [updatedLevel] = await tx
    .update(inventoryLevels)
    .set({
      ...next,
      updatedAt: new Date(),
    })
    .where(eq(inventoryLevels.id, levelId))
    .returning({
      id: inventoryLevels.id,
      variantId: inventoryLevels.variantId,
      onHandQuantity: inventoryLevels.onHandQuantity,
      availableQuantity: inventoryLevels.availableQuantity,
      reservedQuantity: inventoryLevels.reservedQuantity,
      allocatedQuantity: inventoryLevels.allocatedQuantity,
      lowStockThreshold: inventoryLevels.lowStockThreshold,
    })

  return updatedLevel
}

async function createTransaction(
  tx: DbClient,
  input: {
    level: InventoryLevelSnapshot
    type: AdminInventoryTransactionType
    quantityDelta: number
    before: InventoryLevelSnapshot
    after: InventoryLevelSnapshot
    referenceType?: string
    referenceId?: string
    notes?: string
    performedBy?: string | null
  },
) {
  await tx.insert(inventoryTransactions).values({
    variantId: input.level.variantId,
    inventoryLevelId: input.level.id,
    type: input.type,
    quantityDelta: input.quantityDelta,
    beforeOnHandQuantity: input.before.onHandQuantity,
    afterOnHandQuantity: input.after.onHandQuantity,
    beforeReservedQuantity: input.before.reservedQuantity,
    afterReservedQuantity: input.after.reservedQuantity,
    beforeAllocatedQuantity: input.before.allocatedQuantity,
    afterAllocatedQuantity: input.after.allocatedQuantity,
    referenceType: input.referenceType,
    referenceId: input.referenceId,
    notes: input.notes,
    performedBy: input.performedBy ?? null,
  })
}

async function recomputeSerializedLevel(
  tx: DbClient,
  level: InventoryLevelSnapshot,
) {
  const unitRows = await tx
    .select({
      status: inventoryUnits.status,
    })
    .from(inventoryUnits)
    .where(eq(inventoryUnits.variantId, level.variantId))

  let onHandQuantity = 0
  let availableQuantity = 0
  let reservedQuantity = 0
  let allocatedQuantity = 0

  for (const row of unitRows) {
    if (
      row.status === "available" ||
      row.status === "received" ||
      row.status === "returned"
    ) {
      onHandQuantity += 1
      availableQuantity += 1
      continue
    }

    if (row.status === "reserved") {
      onHandQuantity += 1
      reservedQuantity += 1
      continue
    }

    if (row.status === "allocated" || row.status === "packed") {
      onHandQuantity += 1
      allocatedQuantity += 1
    }
  }

  return updateLevelSnapshot(tx, level.id, {
    onHandQuantity,
    availableQuantity,
    reservedQuantity,
    allocatedQuantity,
    lowStockThreshold: level.lowStockThreshold,
  })
}

async function getUnitsForIds(
  tx: DbClient,
  variantId: string,
  unitIds: string[],
) {
  if (unitIds.length === 0) {
    return []
  }

  return tx
    .select({
      id: inventoryUnits.id,
      status: inventoryUnits.status,
      variantId: inventoryUnits.variantId,
    })
    .from(inventoryUnits)
    .where(
      and(
        eq(inventoryUnits.variantId, variantId),
        inArray(inventoryUnits.id, unitIds),
      ),
    )
}

async function removeUnitsFromStock(
  tx: DbClient,
  input: {
    variantId: string
    quantity: number
    nextStatus: Extract<
      AdminInventoryUnitStatus,
      "damaged" | "lost" | "shipped"
    >
    unitIds?: string[]
  },
) {
  const units =
    input.unitIds && input.unitIds.length > 0
      ? await getUnitsForIds(tx, input.variantId, input.unitIds)
      : await tx
          .select({
            id: inventoryUnits.id,
            status: inventoryUnits.status,
          })
          .from(inventoryUnits)
          .where(
            and(
              eq(inventoryUnits.variantId, input.variantId),
              inArray(inventoryUnits.status, [
                "available",
                "received",
                "returned",
              ]),
            ),
          )
          .limit(input.quantity)

  if (units.length !== input.quantity) {
    throw new Error("Not enough serialized units available")
  }

  await tx
    .update(inventoryUnits)
    .set({
      status: input.nextStatus,
      updatedAt: new Date(),
      shippedAt: input.nextStatus === "shipped" ? new Date() : null,
    })
    .where(
      inArray(
        inventoryUnits.id,
        units.map((unit) => unit.id),
      ),
    )

  return units.length
}

async function applyAggregateQuantityTransaction(
  tx: DbClient,
  input: {
    variantId: string
    type: AdminInventoryTransactionType
    deltaOnHand?: number
    deltaAvailable?: number
    deltaReserved?: number
    deltaAllocated?: number
    referenceType?: string
    referenceId?: string
    notes?: string
    performedBy?: string | null
  },
) {
  const level = await getOrCreateLevel(tx, input.variantId)
  const before = toSnapshot(level)
  const next = {
    onHandQuantity: before.onHandQuantity + (input.deltaOnHand ?? 0),
    availableQuantity: before.availableQuantity + (input.deltaAvailable ?? 0),
    reservedQuantity: before.reservedQuantity + (input.deltaReserved ?? 0),
    allocatedQuantity: before.allocatedQuantity + (input.deltaAllocated ?? 0),
    lowStockThreshold: before.lowStockThreshold,
  }

  if (
    next.onHandQuantity < 0 ||
    next.availableQuantity < 0 ||
    next.reservedQuantity < 0 ||
    next.allocatedQuantity < 0
  ) {
    throw new Error("Inventory level cannot become negative")
  }

  if (
    next.availableQuantity !==
    next.onHandQuantity - next.reservedQuantity - next.allocatedQuantity
  ) {
    throw new Error("Inventory level totals are inconsistent")
  }

  const updatedLevel = await updateLevelSnapshot(tx, level.id, next)
  const after = toSnapshot(updatedLevel)

  await createTransaction(tx, {
    level: after,
    type: input.type,
    quantityDelta: input.deltaOnHand ?? 0,
    before,
    after,
    referenceType: input.referenceType,
    referenceId: input.referenceId,
    notes: input.notes,
    performedBy: input.performedBy,
  })

  return {
    before,
    after,
  }
}

async function runInventoryMutation<T>(
  options: InventoryMutationOptions | undefined,
  handler: (tx: DbTransaction) => Promise<T>,
) {
  if (options?.tx) {
    return handler(options.tx as DbTransaction)
  }

  return db.transaction(handler)
}

function buildInventoryListItem(
  variant: InventoryVariantContext,
  level?: {
    onHandQuantity: number
    availableQuantity: number
    reservedQuantity: number
    allocatedQuantity: number
    lowStockThreshold: number
    updatedAt: Date
  },
): AdminInventoryListItem {
  const onHandQuantity = level?.onHandQuantity ?? 0
  const availableQuantity = level?.availableQuantity ?? 0
  const reservedQuantity = level?.reservedQuantity ?? 0
  const allocatedQuantity = level?.allocatedQuantity ?? 0
  const lowStockThreshold = level?.lowStockThreshold ?? 5
  const isOutOfStock = availableQuantity <= 0
  const isLowStock = !isOutOfStock && availableQuantity <= lowStockThreshold

  return {
    id: variant.variantId,
    variantId: variant.variantId,
    productId: variant.productId,
    productName: variant.productName,
    productSlug: variant.productSlug,
    variantName: variant.variantName,
    variantSku: variant.variantSku,
    trackingMode: variant.trackingMode,
    manageInventory: variant.manageInventory,
    onHandQuantity,
    availableQuantity,
    reservedQuantity,
    allocatedQuantity,
    lowStockThreshold,
    isLowStock,
    isOutOfStock,
    updatedAt: level?.updatedAt ?? new Date(0),
  }
}

function filterInventoryByStatus(
  items: AdminInventoryListItem[],
  stockStatus: z.infer<typeof inventoryStatusSchema>,
) {
  if (stockStatus === "all") {
    return items
  }

  if (stockStatus === "low") {
    return items.filter((item) => item.isLowStock)
  }

  if (stockStatus === "out") {
    return items.filter((item) => item.isOutOfStock)
  }

  return items.filter((item) => !item.isLowStock && !item.isOutOfStock)
}

function getInventoryStatusRank(item: AdminInventoryListItem) {
  if (item.isOutOfStock) {
    return 0
  }

  if (item.isLowStock) {
    return 1
  }

  return 2
}

function sortInventoryItems(
  items: AdminInventoryListItem[],
  sortBy: AdminInventorySortField,
  sortOrder: AdminInventorySortOrder,
) {
  const direction = sortOrder === "asc" ? 1 : -1

  return [...items].sort((left, right) => {
    const compare = (() => {
      switch (sortBy) {
        case "product":
          return (
            left.productName.localeCompare(right.productName) ||
            left.variantName.localeCompare(right.variantName) ||
            left.variantSku.localeCompare(right.variantSku)
          )
        case "sku":
          return left.variantSku.localeCompare(right.variantSku)
        case "available":
          return left.availableQuantity - right.availableQuantity
        case "reserved":
          return left.reservedQuantity - right.reservedQuantity
        case "allocated":
          return left.allocatedQuantity - right.allocatedQuantity
        case "onHand":
          return left.onHandQuantity - right.onHandQuantity
        case "status":
          return (
            getInventoryStatusRank(left) - getInventoryStatusRank(right) ||
            left.availableQuantity - right.availableQuantity
          )
        case "updated":
        default:
          return (
            new Date(left.updatedAt).getTime() -
            new Date(right.updatedAt).getTime()
          )
      }
    })()

    if (compare !== 0) {
      return compare * direction
    }

    return left.productName.localeCompare(right.productName)
  })
}

async function getInventoryListBase() {
  const variants = await db
    .select({
      variantId: productVariants.id,
      variantName: productVariants.name,
      variantSku: productVariants.sku,
      trackingMode: products.inventoryTrackingMode,
      manageInventory: productVariants.manageInventory,
      receiptIdentifierTypes: products.receiptIdentifierTypes,
      productId: products.id,
      productName: products.name,
      productSlug: products.slug,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(eq(productVariants.manageInventory, true))
    .orderBy(desc(products.updatedAt), desc(productVariants.updatedAt))

  const variantIds = variants.map((variant) => variant.variantId)
  const levelRows =
    variantIds.length > 0
      ? await db
          .select({
            variantId: inventoryLevels.variantId,
            onHandQuantity: inventoryLevels.onHandQuantity,
            availableQuantity: inventoryLevels.availableQuantity,
            reservedQuantity: inventoryLevels.reservedQuantity,
            allocatedQuantity: inventoryLevels.allocatedQuantity,
            lowStockThreshold: inventoryLevels.lowStockThreshold,
            updatedAt: inventoryLevels.updatedAt,
          })
          .from(inventoryLevels)
          .where(inArray(inventoryLevels.variantId, variantIds))
      : []

  const levelMap = new Map(levelRows.map((level) => [level.variantId, level]))

  return variants.map((variant) =>
    buildInventoryListItem(variant, levelMap.get(variant.variantId)),
  )
}

export async function getInventoryStats(): Promise<AdminInventoryStats> {
  const items = await getInventoryListBase()

  return {
    totalTrackedVariants: items.length,
    quantityTrackedVariants: items.filter(
      (item) => item.trackingMode === "quantity",
    ).length,
    serialTrackedVariants: items.filter(
      (item) => item.trackingMode === "serial",
    ).length,
    lowStockVariants: items.filter((item) => item.isLowStock).length,
    outOfStockVariants: items.filter((item) => item.isOutOfStock).length,
    totalOnHand: items.reduce((sum, item) => sum + item.onHandQuantity, 0),
    totalAvailable: items.reduce(
      (sum, item) => sum + item.availableQuantity,
      0,
    ),
    totalReserved: items.reduce((sum, item) => sum + item.reservedQuantity, 0),
    totalAllocated: items.reduce(
      (sum, item) => sum + item.allocatedQuantity,
      0,
    ),
  }
}

export async function getInventoryItems(
  input: z.input<typeof inventoryListInputSchema> = {},
): Promise<AdminInventoryListResponse["inventory"]> {
  const { page, limit, search, stockStatus, sortBy, sortOrder } =
    inventoryListInputSchema.parse(input)
  const searchValue = search.trim().toLowerCase()

  const matchingItems = (await getInventoryListBase()).filter((item) => {
    if (!searchValue) {
      return true
    }

    return (
      item.productName.toLowerCase().includes(searchValue) ||
      item.productSlug.toLowerCase().includes(searchValue) ||
      item.variantName.toLowerCase().includes(searchValue) ||
      item.variantSku.toLowerCase().includes(searchValue)
    )
  })

  const filteredItems = filterInventoryByStatus(matchingItems, stockStatus)
  const sortedItems = sortInventoryItems(filteredItems, sortBy, sortOrder)
  const offset = (page - 1) * limit
  const paginatedItems = sortedItems.slice(offset, offset + limit)

  return {
    items: paginatedItems,
    pagination: {
      page,
      limit,
      total: sortedItems.length,
      totalPages: Math.max(1, Math.ceil(sortedItems.length / limit)),
    },
  }
}

export async function getLowStockAlerts(
  limit = 5,
): Promise<AdminInventoryLowStockAlert[]> {
  return (await getInventoryListBase())
    .filter((item) => item.isLowStock || item.isOutOfStock)
    .sort((left, right) => left.availableQuantity - right.availableQuantity)
    .slice(0, limit)
    .map((item) => ({
      variantId: item.variantId,
      productName: item.productName,
      productSlug: item.productSlug,
      variantName: item.variantName,
      variantSku: item.variantSku,
      trackingMode: item.trackingMode,
      availableQuantity: item.availableQuantity,
      lowStockThreshold: item.lowStockThreshold,
      isOutOfStock: item.isOutOfStock,
    }))
}

export async function getInventoryDetail(
  variantId: string,
): Promise<AdminInventoryDetail> {
  const variant = await getVariantContext(db, variantId)
  ensureManagedInventory(variant)

  const [levelRows, transactions, units] = await Promise.all([
    db
      .select({
        id: inventoryLevels.id,
        variantId: inventoryLevels.variantId,
        onHandQuantity: inventoryLevels.onHandQuantity,
        availableQuantity: inventoryLevels.availableQuantity,
        reservedQuantity: inventoryLevels.reservedQuantity,
        allocatedQuantity: inventoryLevels.allocatedQuantity,
        lowStockThreshold: inventoryLevels.lowStockThreshold,
        updatedAt: inventoryLevels.updatedAt,
      })
      .from(inventoryLevels)
      .where(eq(inventoryLevels.variantId, variantId))
      .limit(1),
    db
      .select({
        id: inventoryTransactions.id,
        type: inventoryTransactions.type,
        quantityDelta: inventoryTransactions.quantityDelta,
        beforeOnHandQuantity: inventoryTransactions.beforeOnHandQuantity,
        afterOnHandQuantity: inventoryTransactions.afterOnHandQuantity,
        beforeReservedQuantity: inventoryTransactions.beforeReservedQuantity,
        afterReservedQuantity: inventoryTransactions.afterReservedQuantity,
        beforeAllocatedQuantity: inventoryTransactions.beforeAllocatedQuantity,
        afterAllocatedQuantity: inventoryTransactions.afterAllocatedQuantity,
        referenceType: inventoryTransactions.referenceType,
        referenceId: inventoryTransactions.referenceId,
        notes: inventoryTransactions.notes,
        createdAt: inventoryTransactions.createdAt,
        performedByName: user.name,
      })
      .from(inventoryTransactions)
      .leftJoin(user, eq(inventoryTransactions.performedBy, user.id))
      .where(eq(inventoryTransactions.variantId, variantId))
      .orderBy(desc(inventoryTransactions.createdAt))
      .limit(50),
    db.query.inventoryUnits.findMany({
      where: eq(inventoryUnits.variantId, variantId),
      with: {
        identifiers: true,
      },
      orderBy: [desc(inventoryUnits.updatedAt)],
    }),
  ])

  const listItem = buildInventoryListItem(variant, levelRows[0])
  const serializedUnitCount = units.length
  const availableUnitCount = units.filter(
    (unit) =>
      unit.status === "available" ||
      unit.status === "received" ||
      unit.status === "returned",
  ).length

  return {
    variantId: variant.variantId,
    productId: variant.productId,
    productName: variant.productName,
    productSlug: variant.productSlug,
    variantName: variant.variantName,
    variantSku: variant.variantSku,
    trackingMode: variant.trackingMode,
    manageInventory: variant.manageInventory,
    receiptIdentifierTypes: variant.receiptIdentifierTypes,
    stats: {
      onHandQuantity: listItem.onHandQuantity,
      availableQuantity: listItem.availableQuantity,
      reservedQuantity: listItem.reservedQuantity,
      allocatedQuantity: listItem.allocatedQuantity,
      lowStockThreshold: listItem.lowStockThreshold,
      serializedUnitCount,
      availableUnitCount,
    },
    units: units.map((unit) => ({
      id: unit.id,
      status: unit.status,
      notes: unit.notes,
      receivedAt: unit.receivedAt,
      updatedAt: unit.updatedAt,
      identifiers: unit.identifiers.map((identifier) => ({
        id: identifier.id,
        type: identifier.type,
        value: identifier.value,
      })),
    })),
    transactions: transactions.map((transaction) => ({
      ...transaction,
      performedByName: transaction.performedByName,
    })),
  }
}

export async function getProductReceiveStockContext(
  productId: string,
): Promise<AdminProductReceiveStockContext> {
  const [product] = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
    })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1)

  if (!product) {
    throw new Error("Product not found")
  }

  const variants = await db
    .select({
      id: productVariants.id,
      name: productVariants.name,
      sku: productVariants.sku,
      trackingMode: products.inventoryTrackingMode,
      manageInventory: productVariants.manageInventory,
      receiptIdentifierTypes: products.receiptIdentifierTypes,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(eq(productVariants.productId, productId))
    .orderBy(asc(productVariants.sortOrder))

  const manageableVariants = variants.filter(
    (variant) => variant.manageInventory,
  )
  const availabilityMap = await getVariantInventoryAvailabilityMap(
    manageableVariants.map((variant) => variant.id),
  )

  return {
    productId: product.id,
    productName: product.name,
    productSlug: product.slug,
    variants: manageableVariants.map((variant) => {
      const availability = availabilityMap.get(variant.id)

      return {
        id: variant.id,
        name: variant.name,
        sku: variant.sku,
        trackingMode: variant.trackingMode,
        manageInventory: variant.manageInventory,
        receiptIdentifierTypes: variant.receiptIdentifierTypes,
        onHandQuantity: availability?.onHandQuantity ?? 0,
        availableQuantity: availability?.availableQuantity ?? 0,
      }
    }),
  }
}

export async function getInventoryMovements(input: {
  variantId: string
  page: number
  limit?: number
}): Promise<AdminInventoryMovementResponse> {
  const page = Math.max(1, input.page)
  const limit = Math.max(1, Math.min(input.limit ?? 20, 100))
  const offset = (page - 1) * limit

  const allTransactions = await db
    .select({
      id: inventoryTransactions.id,
      type: inventoryTransactions.type,
      quantityDelta: inventoryTransactions.quantityDelta,
      beforeOnHandQuantity: inventoryTransactions.beforeOnHandQuantity,
      afterOnHandQuantity: inventoryTransactions.afterOnHandQuantity,
      beforeReservedQuantity: inventoryTransactions.beforeReservedQuantity,
      afterReservedQuantity: inventoryTransactions.afterReservedQuantity,
      beforeAllocatedQuantity: inventoryTransactions.beforeAllocatedQuantity,
      afterAllocatedQuantity: inventoryTransactions.afterAllocatedQuantity,
      referenceType: inventoryTransactions.referenceType,
      referenceId: inventoryTransactions.referenceId,
      notes: inventoryTransactions.notes,
      createdAt: inventoryTransactions.createdAt,
      performedByName: user.name,
    })
    .from(inventoryTransactions)
    .leftJoin(user, eq(inventoryTransactions.performedBy, user.id))
    .where(eq(inventoryTransactions.variantId, input.variantId))
    .orderBy(desc(inventoryTransactions.createdAt))

  return {
    movements: allTransactions.slice(offset, offset + limit),
    pagination: {
      page,
      limit,
      total: allTransactions.length,
      totalPages: Math.max(1, Math.ceil(allTransactions.length / limit)),
    },
  }
}

export interface VariantInventoryAvailability {
  variantId: string
  manageInventory: boolean
  trackingMode: AdminInventoryTrackingMode
  onHandQuantity: number | null
  availableQuantity: number | null
  reservedQuantity: number
  allocatedQuantity: number
  lowStockThreshold: number | null
}

export async function getVariantInventoryAvailabilityMap(variantIds: string[]) {
  const uniqueVariantIds = Array.from(new Set(variantIds.filter(Boolean)))

  if (uniqueVariantIds.length === 0) {
    return new Map<string, VariantInventoryAvailability>()
  }

  const [variants, levels] = await Promise.all([
    db
      .select({
        variantId: productVariants.id,
        trackingMode: products.inventoryTrackingMode,
        manageInventory: productVariants.manageInventory,
      })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(inArray(productVariants.id, uniqueVariantIds)),
    db
      .select({
        variantId: inventoryLevels.variantId,
        onHandQuantity: inventoryLevels.onHandQuantity,
        availableQuantity: inventoryLevels.availableQuantity,
        reservedQuantity: inventoryLevels.reservedQuantity,
        allocatedQuantity: inventoryLevels.allocatedQuantity,
        lowStockThreshold: inventoryLevels.lowStockThreshold,
      })
      .from(inventoryLevels)
      .where(inArray(inventoryLevels.variantId, uniqueVariantIds)),
  ])

  const levelMap = new Map(levels.map((level) => [level.variantId, level]))

  return new Map(
    variants.map((variant) => {
      const summary = levelMap.get(variant.variantId)

      return [
        variant.variantId,
        {
          variantId: variant.variantId,
          manageInventory: variant.manageInventory,
          trackingMode: variant.trackingMode,
          onHandQuantity: variant.manageInventory
            ? (summary?.onHandQuantity ?? 0)
            : null,
          availableQuantity: variant.manageInventory
            ? (summary?.availableQuantity ?? 0)
            : null,
          reservedQuantity: summary?.reservedQuantity ?? 0,
          allocatedQuantity: summary?.allocatedQuantity ?? 0,
          lowStockThreshold: variant.manageInventory
            ? (summary?.lowStockThreshold ?? 5)
            : null,
        } satisfies VariantInventoryAvailability,
      ]
    }),
  )
}

export async function getVariantInventoryAvailability(variantId: string) {
  return (await getVariantInventoryAvailabilityMap([variantId])).get(variantId)
}

export async function receiveInventory(
  rawInput: z.input<typeof inventoryReceiptSchema>,
) {
  const input = inventoryReceiptSchema.parse(rawInput)
  const performedBy = await getActorUserId()

  return db.transaction(async (tx) => {
    const variant = await getVariantContext(tx, input.variantId)
    ensureManagedInventory(variant)

    if (variant.trackingMode === "quantity") {
      if (!input.quantity || input.quantity <= 0) {
        throw new Error("Quantity receipt requires a positive quantity")
      }

      const result = await applyAggregateQuantityTransaction(tx, {
        variantId: variant.variantId,
        type: "receipt",
        deltaOnHand: input.quantity,
        deltaAvailable: input.quantity,
        referenceType: "manual_receipt",
        notes: input.notes,
        performedBy,
      })

      return {
        success: true as const,
        trackingMode: variant.trackingMode,
        receivedQuantity: input.quantity,
        previousQuantity: result.before.onHandQuantity,
        newQuantity: result.after.onHandQuantity,
      }
    }

    if (!input.units || input.units.length === 0) {
      throw new Error("Serialized receipt requires at least one scanned unit")
    }

    const requiredIdentifierTypes = resolveReceiptIdentifierTemplate(
      variant,
      input.identifierTemplate,
    )
    validateReceivedUnitIdentifiers(input.units, requiredIdentifierTypes)

    const identifierPairs = input.units.flatMap((unit) =>
      unit.identifiers.map((identifier) => ({
        type: identifier.type,
        value: identifier.value.trim(),
        normalizedValue: normalizeIdentifierValue(identifier.value),
      })),
    )

    const duplicateInputPairs = new Set<string>()
    for (const identifier of identifierPairs) {
      const key = `${identifier.type}:${identifier.normalizedValue}`
      if (duplicateInputPairs.has(key)) {
        throw new Error(
          `Duplicate ${identifier.type.toUpperCase()} in receipt batch: ${identifier.value}`,
        )
      }
      duplicateInputPairs.add(key)
    }

    if (identifierPairs.length > 0) {
      const existingIdentifiers = await tx
        .select({
          type: inventoryUnitIdentifiers.type,
          value: inventoryUnitIdentifiers.value,
          normalizedValue: inventoryUnitIdentifiers.normalizedValue,
        })
        .from(inventoryUnitIdentifiers)
        .where(
          inArray(
            inventoryUnitIdentifiers.normalizedValue,
            identifierPairs.map((identifier) => identifier.normalizedValue),
          ),
        )

      for (const existingIdentifier of existingIdentifiers) {
        const matchedInput = identifierPairs.find(
          (identifier) =>
            identifier.type === existingIdentifier.type &&
            identifier.normalizedValue === existingIdentifier.normalizedValue,
        )

        if (matchedInput) {
          throw new Error(
            `Duplicate ${existingIdentifier.type.toUpperCase()} already exists: ${existingIdentifier.value}`,
          )
        }
      }
    }

    const level = await getOrCreateLevel(tx, variant.variantId)
    const before = toSnapshot(level)

    for (const unit of input.units) {
      const [createdUnit] = await tx
        .insert(inventoryUnits)
        .values({
          variantId: variant.variantId,
          status: "available",
          notes: unit.notes ?? null,
        })
        .returning({
          id: inventoryUnits.id,
        })

      await tx.insert(inventoryUnitIdentifiers).values(
        unit.identifiers.map((identifier) => ({
          inventoryUnitId: createdUnit.id,
          type: identifier.type,
          value: identifier.value.trim(),
          normalizedValue: normalizeIdentifierValue(identifier.value),
        })),
      )
    }

    const updatedLevel = await recomputeSerializedLevel(tx, level)
    const after = toSnapshot(updatedLevel)

    await createTransaction(tx, {
      level: after,
      type: "receipt",
      quantityDelta: input.units.length,
      before,
      after,
      referenceType: "manual_receipt",
      notes: input.notes,
      performedBy,
    })

    return {
      success: true as const,
      trackingMode: variant.trackingMode,
      receivedQuantity: input.units.length,
      previousQuantity: before.onHandQuantity,
      newQuantity: after.onHandQuantity,
    }
  })
}

export async function adjustStock(
  rawInput: z.input<typeof stockAdjustmentSchema>,
) {
  const input = stockAdjustmentSchema.parse(rawInput)
  const performedBy = await getActorUserId()

  return db.transaction(async (tx) => {
    const variant = await getVariantContext(tx, input.variantId)
    ensureManagedInventory(variant)

    if (variant.trackingMode === "quantity") {
      const result = await applyAggregateQuantityTransaction(tx, {
        variantId: variant.variantId,
        type:
          input.adjustment > 0 ? "adjustment_increase" : "adjustment_decrease",
        deltaOnHand: input.adjustment,
        deltaAvailable: input.adjustment,
        referenceType: "manual_adjustment",
        notes: input.reason,
        performedBy,
      })

      return {
        success: true as const,
        previousQuantity: result.before.onHandQuantity,
        newQuantity: result.after.onHandQuantity,
      }
    }

    if (input.adjustment > 0) {
      throw new Error(
        "Use the serialized receipt flow to add stock for serialized variants",
      )
    }

    const quantityToRemove = Math.abs(input.adjustment)
    const level = await getOrCreateLevel(tx, variant.variantId)
    const before = toSnapshot(level)

    await removeUnitsFromStock(tx, {
      variantId: variant.variantId,
      quantity: quantityToRemove,
      nextStatus: "lost",
    })

    const updatedLevel = await recomputeSerializedLevel(tx, level)
    const after = toSnapshot(updatedLevel)

    await createTransaction(tx, {
      level: after,
      type: "adjustment_decrease",
      quantityDelta: input.adjustment,
      before,
      after,
      referenceType: "manual_adjustment",
      notes: input.reason,
      performedBy,
    })

    return {
      success: true as const,
      previousQuantity: before.onHandQuantity,
      newQuantity: after.onHandQuantity,
    }
  })
}

export async function updateLowStockThreshold(
  rawVariantId: string,
  rawThreshold: number,
) {
  const input = lowStockThresholdSchema.parse({
    variantId: rawVariantId,
    threshold: rawThreshold,
  })

  return db.transaction(async (tx) => {
    const variant = await getVariantContext(tx, input.variantId)
    ensureManagedInventory(variant)

    const level = await getOrCreateLevel(tx, input.variantId)
    await tx
      .update(inventoryLevels)
      .set({
        lowStockThreshold: input.threshold,
        updatedAt: new Date(),
      })
      .where(eq(inventoryLevels.id, level.id))

    return {
      success: true as const,
      threshold: input.threshold,
    }
  })
}

export async function reserveInventory(
  rawInput: z.input<typeof transactionQuantitySchema>,
  options?: InventoryMutationOptions,
) {
  const input = transactionQuantitySchema.parse(rawInput)
  return runInventoryMutation(options, async (tx) => {
    const variant = await getVariantContext(tx, input.variantId)
    ensureManagedInventory(variant)

    return applyAggregateQuantityTransaction(tx, {
      variantId: variant.variantId,
      type: "reservation",
      deltaAvailable: -input.quantity,
      deltaReserved: input.quantity,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      notes: input.notes,
    })
  })
}

export async function releaseReservedInventory(
  rawInput: z.input<typeof transactionQuantitySchema>,
  options?: InventoryMutationOptions,
) {
  const input = transactionQuantitySchema.parse(rawInput)
  return runInventoryMutation(options, async (tx) => {
    const variant = await getVariantContext(tx, input.variantId)
    ensureManagedInventory(variant)

    return applyAggregateQuantityTransaction(tx, {
      variantId: variant.variantId,
      type: "reservation_release",
      deltaAvailable: input.quantity,
      deltaReserved: -input.quantity,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      notes: input.notes,
    })
  })
}

export async function allocateInventory(
  rawInput: z.input<typeof transactionQuantitySchema>,
  options?: InventoryMutationOptions,
) {
  const input = transactionQuantitySchema.parse(rawInput)
  return runInventoryMutation(options, async (tx) => {
    const variant = await getVariantContext(tx, input.variantId)
    ensureManagedInventory(variant)

    if (
      variant.trackingMode === "serial" &&
      input.unitIds &&
      input.unitIds.length > 0
    ) {
      const units = await getUnitsForIds(tx, variant.variantId, input.unitIds)

      if (units.length !== input.unitIds.length) {
        throw new Error("One or more serialized units were not found")
      }

      await tx
        .update(inventoryUnits)
        .set({
          status: "allocated",
          updatedAt: new Date(),
        })
        .where(
          inArray(
            inventoryUnits.id,
            units.map((unit) => unit.id),
          ),
        )
    }

    return applyAggregateQuantityTransaction(tx, {
      variantId: variant.variantId,
      type: "allocation",
      deltaReserved: -input.quantity,
      deltaAllocated: input.quantity,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      notes: input.notes,
    })
  })
}

export async function releaseAllocatedInventory(
  rawInput: z.input<typeof transactionQuantitySchema>,
  options?: InventoryMutationOptions,
) {
  const input = transactionQuantitySchema.parse(rawInput)
  return runInventoryMutation(options, async (tx) => {
    const variant = await getVariantContext(tx, input.variantId)
    ensureManagedInventory(variant)

    if (
      variant.trackingMode === "serial" &&
      input.unitIds &&
      input.unitIds.length > 0
    ) {
      const units = await getUnitsForIds(tx, variant.variantId, input.unitIds)

      await tx
        .update(inventoryUnits)
        .set({
          status: "available",
          updatedAt: new Date(),
          packedAt: null,
        })
        .where(
          inArray(
            inventoryUnits.id,
            units.map((unit) => unit.id),
          ),
        )
    }

    return applyAggregateQuantityTransaction(tx, {
      variantId: variant.variantId,
      type: "allocation_release",
      deltaAvailable: input.quantity,
      deltaAllocated: -input.quantity,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      notes: input.notes,
    })
  })
}

export async function unallocateInventoryToReservation(
  rawInput: z.input<typeof transactionQuantitySchema>,
  options?: InventoryMutationOptions,
) {
  const input = transactionQuantitySchema.parse(rawInput)
  return runInventoryMutation(options, async (tx) => {
    const variant = await getVariantContext(tx, input.variantId)
    ensureManagedInventory(variant)

    if (
      variant.trackingMode === "serial" &&
      input.unitIds &&
      input.unitIds.length > 0
    ) {
      const units = await getUnitsForIds(tx, variant.variantId, input.unitIds)

      await tx
        .update(inventoryUnits)
        .set({
          status: "available",
          updatedAt: new Date(),
          packedAt: null,
        })
        .where(
          inArray(
            inventoryUnits.id,
            units.map((unit) => unit.id),
          ),
        )
    }

    return applyAggregateQuantityTransaction(tx, {
      variantId: variant.variantId,
      type: "allocation_release",
      deltaReserved: input.quantity,
      deltaAllocated: -input.quantity,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      notes: input.notes,
    })
  })
}

export async function shipInventory(
  rawInput: z.input<typeof transactionQuantitySchema>,
  options?: InventoryMutationOptions,
) {
  const input = transactionQuantitySchema.parse(rawInput)
  return runInventoryMutation(options, async (tx) => {
    const variant = await getVariantContext(tx, input.variantId)
    ensureManagedInventory(variant)

    if (variant.trackingMode === "serial") {
      if (!input.unitIds || input.unitIds.length !== input.quantity) {
        throw new Error(
          "Shipping serialized inventory requires exact unit assignments",
        )
      }

      await removeUnitsFromStock(tx, {
        variantId: variant.variantId,
        quantity: input.quantity,
        nextStatus: "shipped",
        unitIds: input.unitIds,
      })
    }

    return applyAggregateQuantityTransaction(tx, {
      variantId: variant.variantId,
      type: "shipment",
      deltaOnHand: -input.quantity,
      deltaAllocated: -input.quantity,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      notes: input.notes,
    })
  })
}

export async function returnInventory(
  rawInput: z.input<typeof transactionQuantitySchema>,
) {
  const input = transactionQuantitySchema.parse(rawInput)
  const performedBy = await getActorUserId()

  return db.transaction(async (tx) => {
    const variant = await getVariantContext(tx, input.variantId)
    ensureManagedInventory(variant)

    if (variant.trackingMode === "quantity") {
      return applyAggregateQuantityTransaction(tx, {
        variantId: variant.variantId,
        type: "return",
        deltaOnHand: input.quantity,
        deltaAvailable: input.quantity,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        notes: input.notes,
        performedBy,
      })
    }

    if (!input.unitIds || input.unitIds.length !== input.quantity) {
      throw new Error(
        "Returning serialized inventory requires the affected unit IDs",
      )
    }

    const level = await getOrCreateLevel(tx, variant.variantId)
    const before = toSnapshot(level)
    const units = await getUnitsForIds(tx, variant.variantId, input.unitIds)

    if (units.length !== input.unitIds.length) {
      throw new Error("One or more serialized return units were not found")
    }

    await tx
      .update(inventoryUnits)
      .set({
        status: "returned",
        updatedAt: new Date(),
        returnedAt: new Date(),
      })
      .where(
        inArray(
          inventoryUnits.id,
          units.map((unit) => unit.id),
        ),
      )

    const updatedLevel = await recomputeSerializedLevel(tx, level)
    const after = toSnapshot(updatedLevel)

    await createTransaction(tx, {
      level: after,
      type: "return",
      quantityDelta: input.quantity,
      before,
      after,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      notes: input.notes,
      performedBy,
    })

    return {
      success: true as const,
      previousQuantity: before.onHandQuantity,
      newQuantity: after.onHandQuantity,
    }
  })
}

async function changeSerializedUnitAvailability(
  rawInput: z.input<typeof transactionQuantitySchema>,
  nextStatus: "damaged" | "lost",
  type: AdminInventoryTransactionType,
) {
  const input = transactionQuantitySchema.parse(rawInput)
  const performedBy = await getActorUserId()

  return db.transaction(async (tx) => {
    const variant = await getVariantContext(tx, input.variantId)
    ensureManagedInventory(variant)

    if (variant.trackingMode === "quantity") {
      return applyAggregateQuantityTransaction(tx, {
        variantId: variant.variantId,
        type,
        deltaOnHand: -input.quantity,
        deltaAvailable: -input.quantity,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        notes: input.notes,
        performedBy,
      })
    }

    const level = await getOrCreateLevel(tx, variant.variantId)
    const before = toSnapshot(level)

    await removeUnitsFromStock(tx, {
      variantId: variant.variantId,
      quantity: input.quantity,
      nextStatus,
      unitIds: input.unitIds,
    })

    const updatedLevel = await recomputeSerializedLevel(tx, level)
    const after = toSnapshot(updatedLevel)

    await createTransaction(tx, {
      level: after,
      type,
      quantityDelta: -input.quantity,
      before,
      after,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      notes: input.notes,
      performedBy,
    })

    return {
      success: true as const,
      previousQuantity: before.onHandQuantity,
      newQuantity: after.onHandQuantity,
    }
  })
}

export async function markInventoryAsDamaged(
  rawInput: z.input<typeof transactionQuantitySchema>,
) {
  return changeSerializedUnitAvailability(rawInput, "damaged", "damage")
}

export async function markInventoryAsLost(
  rawInput: z.input<typeof transactionQuantitySchema>,
) {
  return changeSerializedUnitAvailability(rawInput, "lost", "loss")
}

export async function searchInventoryUnits(
  variantId: string,
  query: string,
): Promise<
  Array<{
    id: string
    status: AdminInventoryUnitStatus
    identifiers: Array<{
      id: string
      type: AdminInventoryIdentifierType
      value: string
    }>
  }>
> {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return []
  }

  const units = await db.query.inventoryUnits.findMany({
    where: eq(inventoryUnits.variantId, variantId),
    with: {
      identifiers: true,
    },
    orderBy: [desc(inventoryUnits.updatedAt)],
  })

  return units
    .filter((unit) =>
      unit.identifiers.some((identifier) =>
        identifier.normalizedValue.includes(normalizedQuery),
      ),
    )
    .slice(0, 20)
    .map((unit) => ({
      id: unit.id,
      status: unit.status,
      identifiers: unit.identifiers.map((identifier) => ({
        id: identifier.id,
        type: identifier.type,
        value: identifier.value,
      })),
    }))
}
