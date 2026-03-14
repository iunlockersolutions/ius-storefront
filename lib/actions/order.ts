"use server"

import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
  or,
  sql,
} from "drizzle-orm"
import { z } from "zod"

import {
  allocateInventory,
  releaseAllocatedInventory,
  releaseReservedInventory,
  shipInventory,
  unallocateInventoryToReservation,
} from "@/lib/actions/inventory"
import { getServerSession, requireStaff } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import {
  inventoryUnitIdentifiers,
  inventoryUnits,
  orderItemAllocations,
  orderItems,
  orderItemUnitAssignments,
  orders,
  orderStatusHistory,
  products,
  productVariants,
  shipments,
  user,
} from "@/lib/db/schema"
import {
  type OrderEmailData,
  sendOrderDeliveredEmail,
  sendOrderShippedEmail,
} from "@/lib/email/order-notifications"
import { ensureOrderInventoryReservationsTx } from "@/lib/orders/inventory-reservations"
import type {
  AdminOrder,
  AdminOrderItem,
  AdminOrderShipment,
  AdminOrderStatus,
  AdminOrderUnitAssignment,
} from "@/lib/types/admin-order"
import { revalidateOrderCaches } from "@/lib/utils/cache"

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

const ORDER_VALID_TRANSITIONS: Record<AdminOrderStatus, AdminOrderStatus[]> = {
  draft: ["pending_payment", "cancelled"],
  pending_payment: ["paid", "cancelled"],
  paid: ["processing", "cancelled"],
  processing: ["packing", "cancelled"],
  packing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
}

const orderFilterSchema = z.object({
  status: z
    .enum([
      "draft",
      "pending_payment",
      "paid",
      "processing",
      "packing",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ])
    .optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
})

const updateOrderStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum([
    "draft",
    "pending_payment",
    "paid",
    "processing",
    "packing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ]),
  notes: z.string().trim().optional(),
})

const startPackingSchema = z.object({
  orderId: z.string().uuid(),
  notes: z.string().trim().optional(),
})

const scanPackingUnitSchema = z.object({
  orderId: z.string().uuid(),
  orderItemId: z.string().uuid(),
  identifier: z.string().trim().min(1),
})

const unassignPackingUnitSchema = z.object({
  orderId: z.string().uuid(),
  orderItemId: z.string().uuid(),
  inventoryUnitId: z.string().uuid(),
})

const completePackingSchema = z.object({
  orderId: z.string().uuid(),
  notes: z.string().trim().optional(),
  carrier: z.string().trim().optional(),
  trackingNumber: z.string().trim().optional(),
  trackingUrl: z.string().trim().url().optional(),
})

type OrderFilterInput = z.infer<typeof orderFilterSchema>
type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>

function normalizeIdentifierValue(value: string) {
  return value.trim().toLowerCase()
}

function isValidTransition(from: AdminOrderStatus, to: AdminOrderStatus) {
  return ORDER_VALID_TRANSITIONS[from]?.includes(to) ?? false
}

async function getOrderBase(tx: typeof db | DbTransaction, orderId: string) {
  const [order] = await tx
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      subtotal: orders.subtotal,
      taxAmount: orders.taxAmount,
      shippingCost: orders.shippingCost,
      discountAmount: orders.discountAmount,
      total: orders.total,
      notes: orders.notes,
      adminNotes: orders.adminNotes,
      customerEmail: orders.customerEmail,
      customerPhone: orders.customerPhone,
      customerName: orders.customerName,
      shippingAddress: orders.shippingAddress,
      billingAddress: orders.billingAddress,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      customer: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
    .from(orders)
    .leftJoin(user, eq(orders.userId, user.id))
    .where(eq(orders.id, orderId))
    .limit(1)

  return order ?? null
}

function buildPackingSummary(
  items: AdminOrderItem[],
  status: AdminOrderStatus,
) {
  const enforcePackingRequirements =
    status === "processing" || status === "packing"
  let totalSerializedUnitsRequired = 0
  let totalSerializedUnitsAssigned = 0
  let serializedLinesRemaining = 0
  let quantityLinesRequiringAllocation = 0
  let quantityLinesAllocated = 0
  const issues: string[] = []

  for (const item of items) {
    if (!item.packing.manageInventory) {
      continue
    }

    if (!item.variantId || !item.variant) {
      if (enforcePackingRequirements) {
        issues.push(`${item.productName}: missing variant link for packing`)
      }
      continue
    }

    if (item.packing.trackingMode === "serial") {
      totalSerializedUnitsRequired += item.quantity
      totalSerializedUnitsAssigned += item.packing.assignedUnitCount

      if (item.packing.assignedUnitCount < item.quantity) {
        serializedLinesRemaining += 1
        if (enforcePackingRequirements) {
          issues.push(
            `${item.productName}: assign ${item.quantity - item.packing.assignedUnitCount} more serialized unit(s)`,
          )
        }
      }

      continue
    }

    quantityLinesRequiringAllocation += 1
    if (item.packing.allocatedQuantity >= item.quantity) {
      quantityLinesAllocated += 1
    } else if (enforcePackingRequirements) {
      issues.push(
        `${item.productName}: allocate ${item.quantity - item.packing.allocatedQuantity} more unit(s)`,
      )
    }
  }

  return {
    canStart: status === "processing" || status === "packing",
    canComplete: status === "packing" && issues.length === 0,
    isStarted:
      status === "packing" ||
      status === "shipped" ||
      status === "delivered" ||
      status === "refunded",
    totalSerializedUnitsRequired,
    totalSerializedUnitsAssigned,
    serializedLinesRemaining,
    quantityLinesRequiringAllocation,
    quantityLinesAllocated,
    issues,
  }
}

async function getOrderAggregate(
  tx: typeof db | DbTransaction,
  orderId: string,
): Promise<AdminOrder | null> {
  const order = await getOrderBase(tx, orderId)

  if (!order) {
    return null
  }

  const [
    itemRows,
    allocationRows,
    assignmentRows,
    shipmentRows,
    statusHistory,
  ] = await Promise.all([
    tx
      .select({
        id: orderItems.id,
        variantId: orderItems.variantId,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        subtotal: orderItems.subtotal,
        productName: orderItems.productName,
        variantName: orderItems.variantName,
        sku: orderItems.sku,
        variant: {
          id: productVariants.id,
          name: productVariants.name,
          sku: productVariants.sku,
          trackingMode: products.inventoryTrackingMode,
          manageInventory: productVariants.manageInventory,
        },
      })
      .from(orderItems)
      .leftJoin(productVariants, eq(orderItems.variantId, productVariants.id))
      .leftJoin(products, eq(productVariants.productId, products.id))
      .where(eq(orderItems.orderId, orderId)),
    tx
      .select({
        id: orderItemAllocations.id,
        orderItemId: orderItemAllocations.orderItemId,
        quantity: orderItemAllocations.quantity,
        allocatedAt: orderItemAllocations.allocatedAt,
        releasedAt: orderItemAllocations.releasedAt,
      })
      .from(orderItemAllocations)
      .where(eq(orderItemAllocations.orderId, orderId)),
    tx
      .select({
        id: orderItemUnitAssignments.id,
        orderItemId: orderItemUnitAssignments.orderItemId,
        inventoryUnitId: orderItemUnitAssignments.inventoryUnitId,
        assignedAt: orderItemUnitAssignments.assignedAt,
        unassignedAt: orderItemUnitAssignments.unassignedAt,
        unitStatus: inventoryUnits.status,
      })
      .from(orderItemUnitAssignments)
      .innerJoin(
        inventoryUnits,
        eq(orderItemUnitAssignments.inventoryUnitId, inventoryUnits.id),
      )
      .where(eq(orderItemUnitAssignments.orderId, orderId)),
    tx
      .select({
        id: shipments.id,
        carrier: shipments.carrier,
        trackingNumber: shipments.trackingNumber,
        trackingUrl: shipments.trackingUrl,
        shippedAt: shipments.shippedAt,
        deliveredAt: shipments.deliveredAt,
        notes: shipments.notes,
        createdAt: shipments.createdAt,
      })
      .from(shipments)
      .where(eq(shipments.orderId, orderId))
      .orderBy(desc(shipments.createdAt)),
    tx
      .select({
        id: orderStatusHistory.id,
        fromStatus: orderStatusHistory.fromStatus,
        toStatus: orderStatusHistory.toStatus,
        notes: orderStatusHistory.notes,
        createdAt: orderStatusHistory.createdAt,
        changedBy: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
      .from(orderStatusHistory)
      .leftJoin(user, eq(orderStatusHistory.changedBy, user.id))
      .where(eq(orderStatusHistory.orderId, orderId))
      .orderBy(desc(orderStatusHistory.createdAt)),
  ])

  const unitIds = assignmentRows.map((assignment) => assignment.inventoryUnitId)
  const identifierRows =
    unitIds.length > 0
      ? await tx
          .select({
            id: inventoryUnitIdentifiers.id,
            inventoryUnitId: inventoryUnitIdentifiers.inventoryUnitId,
            type: inventoryUnitIdentifiers.type,
            value: inventoryUnitIdentifiers.value,
          })
          .from(inventoryUnitIdentifiers)
          .where(inArray(inventoryUnitIdentifiers.inventoryUnitId, unitIds))
      : []

  const identifiersByUnit = new Map<
    string,
    AdminOrderUnitAssignment["identifiers"]
  >()
  for (const identifier of identifierRows) {
    const existing = identifiersByUnit.get(identifier.inventoryUnitId) ?? []
    existing.push({
      id: identifier.id,
      type: identifier.type,
      value: identifier.value,
    })
    identifiersByUnit.set(identifier.inventoryUnitId, existing)
  }

  const allocationsByItem = new Map<
    string,
    AdminOrderItem["packing"]["allocations"]
  >()
  for (const allocation of allocationRows) {
    const existing = allocationsByItem.get(allocation.orderItemId) ?? []
    existing.push({
      id: allocation.id,
      quantity: allocation.quantity,
      allocatedAt: allocation.allocatedAt,
      releasedAt: allocation.releasedAt,
    })
    allocationsByItem.set(allocation.orderItemId, existing)
  }

  const assignmentsByItem = new Map<
    string,
    AdminOrderItem["packing"]["assignments"]
  >()
  for (const assignment of assignmentRows) {
    const existing = assignmentsByItem.get(assignment.orderItemId) ?? []
    existing.push({
      id: assignment.id,
      inventoryUnitId: assignment.inventoryUnitId,
      assignedAt: assignment.assignedAt,
      unassignedAt: assignment.unassignedAt,
      unitStatus: assignment.unitStatus,
      identifiers: identifiersByUnit.get(assignment.inventoryUnitId) ?? [],
    })
    assignmentsByItem.set(assignment.orderItemId, existing)
  }

  const items: AdminOrderItem[] = itemRows.map((item) => {
    const allocations = allocationsByItem.get(item.id) ?? []
    const assignments = assignmentsByItem.get(item.id) ?? []
    const activeAllocations = allocations.filter(
      (allocation) => allocation.releasedAt === null,
    )
    const activeAssignments = assignments.filter(
      (assignment) => assignment.unassignedAt === null,
    )
    const allocatedQuantity = activeAllocations.reduce(
      (sum, allocation) => sum + allocation.quantity,
      0,
    )
    const assignedUnitCount = activeAssignments.length
    const trackingMode = item.variant?.trackingMode ?? null
    const manageInventory = item.variant?.manageInventory ?? false

    return {
      id: item.id,
      variantId: item.variantId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
      productName: item.productName,
      variantName: item.variantName,
      sku: item.sku,
      variant: item.variant
        ? {
            id: item.variant.id,
            name: item.variant.name,
            sku: item.variant.sku,
            trackingMode: item.variant.trackingMode,
            manageInventory: item.variant.manageInventory ?? false,
          }
        : null,
      packing: {
        trackingMode,
        manageInventory,
        allocatedQuantity,
        assignedUnitCount,
        pendingSerializedCount:
          trackingMode === "serial"
            ? Math.max(0, item.quantity - assignedUnitCount)
            : 0,
        allocations,
        assignments,
      },
    }
  })

  return {
    ...order,
    items,
    statusHistory,
    shipments: shipmentRows as AdminOrderShipment[],
    packing: buildPackingSummary(items, order.status),
  }
}

async function transitionOrderStatusTx(
  tx: DbTransaction,
  input: {
    orderId: string
    currentStatus: AdminOrderStatus
    nextStatus: AdminOrderStatus
    notes?: string
    changedBy: string | null
  },
) {
  if (!isValidTransition(input.currentStatus, input.nextStatus)) {
    throw new Error(
      `Cannot change status from ${input.currentStatus} to ${input.nextStatus}`,
    )
  }

  await tx
    .update(orders)
    .set({
      status: input.nextStatus,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, input.orderId))

  await tx.insert(orderStatusHistory).values({
    orderId: input.orderId,
    fromStatus: input.currentStatus,
    toStatus: input.nextStatus,
    notes: input.notes ?? null,
    changedBy: input.changedBy,
  })
}

async function releasePackingStateTx(tx: DbTransaction, order: AdminOrder) {
  for (const item of order.items) {
    if (!item.variantId || !item.packing.manageInventory) {
      continue
    }

    const activeAllocations = item.packing.allocations.filter(
      (allocation) => allocation.releasedAt === null,
    )

    if (
      item.packing.trackingMode === "quantity" &&
      activeAllocations.length > 0
    ) {
      const quantity = activeAllocations.reduce(
        (sum, allocation) => sum + allocation.quantity,
        0,
      )

      await releaseAllocatedInventory(
        {
          variantId: item.variantId,
          quantity,
          referenceType: "order",
          referenceId: order.id,
          notes: "Released after order cancellation",
        },
        { tx },
      )

      await tx
        .update(orderItemAllocations)
        .set({
          releasedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(orderItemAllocations.orderItemId, item.id),
            isNull(orderItemAllocations.releasedAt),
          ),
        )
    }

    const reservedQuantityRemaining = Math.max(
      0,
      item.quantity -
        activeAllocations.reduce(
          (sum, allocation) => sum + allocation.quantity,
          0,
        ),
    )

    if (item.packing.trackingMode === "quantity" && reservedQuantityRemaining) {
      await releaseReservedInventory(
        {
          variantId: item.variantId,
          quantity: reservedQuantityRemaining,
          referenceType: "order",
          referenceId: order.id,
          notes: "Released after order cancellation",
        },
        { tx },
      )
    }

    const activeAssignments = item.packing.assignments.filter(
      (assignment) => assignment.unassignedAt === null,
    )

    if (
      item.packing.trackingMode === "serial" &&
      activeAssignments.length > 0
    ) {
      const unitIds = activeAssignments.map(
        (assignment) => assignment.inventoryUnitId,
      )

      await releaseAllocatedInventory(
        {
          variantId: item.variantId,
          quantity: unitIds.length,
          unitIds,
          referenceType: "order_item",
          referenceId: item.id,
          notes: "Released after order cancellation",
        },
        { tx },
      )

      await tx
        .update(orderItemUnitAssignments)
        .set({
          unassignedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(orderItemUnitAssignments.orderItemId, item.id),
            isNull(orderItemUnitAssignments.unassignedAt),
          ),
        )

      await tx
        .update(inventoryUnits)
        .set({
          allocatedOrderId: null,
          allocatedOrderItemId: null,
          updatedAt: new Date(),
        })
        .where(inArray(inventoryUnits.id, unitIds))
    }

    const reservedSerializedQuantityRemaining = Math.max(
      0,
      item.quantity - activeAssignments.length,
    )

    if (
      item.packing.trackingMode === "serial" &&
      reservedSerializedQuantityRemaining
    ) {
      await releaseReservedInventory(
        {
          variantId: item.variantId,
          quantity: reservedSerializedQuantityRemaining,
          referenceType: "order",
          referenceId: order.id,
          notes: "Released after order cancellation",
        },
        { tx },
      )
    }
  }
}

async function getOrderForEmail(
  orderId: string,
): Promise<OrderEmailData | null> {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  })

  if (!order) return null

  const items = await db
    .select({
      productName: orderItems.productName,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId))

  return {
    orderNumber: order.orderNumber,
    customerName: order.customerName || "Customer",
    customerEmail: order.customerEmail,
    total: new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(parseFloat(order.total)),
    items: items.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
      price: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(parseFloat(item.unitPrice)),
    })),
    shippingAddress: order.shippingAddress as OrderEmailData["shippingAddress"],
  }
}

export async function getOrders(
  input: OrderFilterInput = { page: 1, limit: 20 },
) {
  try {
    await requireStaff()
    const { status, search, startDate, endDate, page, limit } =
      orderFilterSchema.parse(input)
    const offset = (page - 1) * limit

    const conditions = []

    if (status) {
      conditions.push(eq(orders.status, status))
    }

    if (search) {
      conditions.push(
        or(
          ilike(orders.orderNumber, `%${search}%`),
          ilike(user.email, `%${search}%`),
        ),
      )
    }

    if (startDate) {
      conditions.push(gte(orders.createdAt, new Date(startDate)))
    }

    if (endDate) {
      conditions.push(lte(orders.createdAt, new Date(endDate)))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [ordersList, [{ total }]] = await Promise.all([
      db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          status: orders.status,
          subtotal: orders.subtotal,
          tax: orders.taxAmount,
          shippingCost: orders.shippingCost,
          discount: orders.discountAmount,
          total: orders.total,
          createdAt: orders.createdAt,
          customer: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
        })
        .from(orders)
        .leftJoin(user, eq(orders.userId, user.id))
        .where(whereClause)
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count() })
        .from(orders)
        .leftJoin(user, eq(orders.userId, user.id))
        .where(whereClause),
    ])

    return {
      success: true as const,
      data: {
        orders: ordersList,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    }
  } catch (error) {
    console.error("Failed to fetch orders:", error)
    return { success: false as const, error: "Failed to fetch orders" }
  }
}

export async function getOrder(orderId: string) {
  try {
    await requireStaff()
    const order = await getOrderAggregate(db, orderId)

    if (!order) {
      return { success: false as const, error: "Order not found" }
    }

    return {
      success: true as const,
      data: order,
    }
  } catch (error) {
    console.error("Failed to fetch order:", error)
    return { success: false as const, error: "Failed to fetch order" }
  }
}

export async function updateOrderStatus(input: UpdateOrderStatusInput) {
  try {
    const session = await getServerSession()
    await requireStaff()
    const { orderId, status, notes } = updateOrderStatusSchema.parse(input)

    if (status === "packing") {
      return {
        success: false as const,
        error: "Use the packing start flow to move an order into packing",
      }
    }

    if (status === "shipped") {
      return {
        success: false as const,
        error: "Use the packing completion flow to ship an order",
      }
    }

    const result = await db.transaction(async (tx) => {
      const order = await getOrderAggregate(tx, orderId)

      if (!order) {
        return { success: false as const, error: "Order not found" }
      }

      if (!isValidTransition(order.status, status)) {
        return {
          success: false as const,
          error: `Cannot change status from ${order.status} to ${status}`,
        }
      }

      if (
        status === "cancelled" &&
        (order.status === "draft" ||
          order.status === "pending_payment" ||
          order.status === "paid" ||
          order.status === "processing" ||
          order.status === "packing")
      ) {
        await releasePackingStateTx(tx, order)
      }

      await transitionOrderStatusTx(tx, {
        orderId,
        currentStatus: order.status,
        nextStatus: status,
        notes,
        changedBy: session?.user?.id ?? null,
      })

      return { success: true as const }
    })

    if (!result.success) {
      return result
    }

    if (status === "delivered") {
      const orderData = await getOrderForEmail(orderId)
      if (orderData) {
        await sendOrderDeliveredEmail(orderData)
      }
    }

    if (status === "paid") {
      revalidateOrderCaches()
    }

    return { success: true as const }
  } catch (error) {
    console.error("Failed to update order status:", error)
    return { success: false as const, error: "Failed to update order status" }
  }
}

export async function startOrderPacking(
  rawInput: z.input<typeof startPackingSchema>,
) {
  try {
    const session = await getServerSession()
    await requireStaff()
    const { orderId, notes } = startPackingSchema.parse(rawInput)

    const result = await db.transaction(async (tx) => {
      const order = await getOrderAggregate(tx, orderId)

      if (!order) {
        return { success: false as const, error: "Order not found" }
      }

      if (order.status !== "processing" && order.status !== "packing") {
        return {
          success: false as const,
          error: "Only processing orders can enter packing",
        }
      }

      await ensureOrderInventoryReservationsTx(
        tx,
        order.id,
        `Ensured reservation before packing order ${order.orderNumber}`,
      )

      for (const item of order.items) {
        if (
          !item.variantId ||
          !item.packing.manageInventory ||
          item.packing.trackingMode !== "quantity"
        ) {
          continue
        }

        const missingQuantity = Math.max(
          0,
          item.quantity - item.packing.allocatedQuantity,
        )

        if (missingQuantity === 0) {
          continue
        }

        await allocateInventory(
          {
            variantId: item.variantId,
            quantity: missingQuantity,
            referenceType: "order",
            referenceId: order.id,
            notes: `Allocated for order ${order.orderNumber} packing`,
          },
          { tx },
        )

        await tx.insert(orderItemAllocations).values({
          orderId: order.id,
          orderItemId: item.id,
          variantId: item.variantId,
          quantity: missingQuantity,
        })
      }

      if (order.status === "processing") {
        await transitionOrderStatusTx(tx, {
          orderId: order.id,
          currentStatus: order.status,
          nextStatus: "packing",
          notes,
          changedBy: session?.user?.id ?? null,
        })
      }

      return { success: true as const }
    })

    return result
  } catch (error) {
    console.error("Failed to start order packing:", error)
    return { success: false as const, error: "Failed to start order packing" }
  }
}

export async function scanOrderPackingUnit(
  rawInput: z.input<typeof scanPackingUnitSchema>,
) {
  try {
    await requireStaff()
    const { orderId, orderItemId, identifier } =
      scanPackingUnitSchema.parse(rawInput)
    const normalizedIdentifier = normalizeIdentifierValue(identifier)

    return db.transaction(async (tx) => {
      const order = await getOrderAggregate(tx, orderId)

      if (!order) {
        return { success: false as const, error: "Order not found" }
      }

      if (order.status !== "packing") {
        return {
          success: false as const,
          error: "Order must be in packing before scanning serialized units",
        }
      }

      const item = order.items.find((candidate) => candidate.id === orderItemId)

      if (!item || !item.variantId || !item.variant) {
        return { success: false as const, error: "Order item not found" }
      }

      if (
        !item.packing.manageInventory ||
        item.packing.trackingMode !== "serial"
      ) {
        return {
          success: false as const,
          error: "Selected line does not require serialized scanning",
        }
      }

      const activeAssignments = item.packing.assignments.filter(
        (assignment) => assignment.unassignedAt === null,
      )

      if (activeAssignments.length >= item.quantity) {
        return {
          success: false as const,
          error:
            "This order line already has all required serialized units assigned",
        }
      }

      const unitMatches = await tx
        .select({
          unitId: inventoryUnits.id,
          unitVariantId: inventoryUnits.variantId,
          unitStatus: inventoryUnits.status,
        })
        .from(inventoryUnitIdentifiers)
        .innerJoin(
          inventoryUnits,
          eq(inventoryUnitIdentifiers.inventoryUnitId, inventoryUnits.id),
        )
        .where(
          eq(inventoryUnitIdentifiers.normalizedValue, normalizedIdentifier),
        )

      const uniqueUnits = Array.from(
        new Map(unitMatches.map((unit) => [unit.unitId, unit])).values(),
      )

      if (uniqueUnits.length === 0) {
        return {
          success: false as const,
          error: "Scanned identifier was not found",
        }
      }

      if (uniqueUnits.length > 1) {
        return {
          success: false as const,
          error:
            "Scanned identifier matches multiple units; use a more specific identifier",
        }
      }

      const matchedUnit = uniqueUnits[0]

      if (matchedUnit.unitVariantId !== item.variantId) {
        return {
          success: false as const,
          error: "Scanned unit belongs to a different product variant",
        }
      }

      const [existingAssignment] = await tx
        .select({
          id: orderItemUnitAssignments.id,
          orderId: orderItemUnitAssignments.orderId,
          orderItemId: orderItemUnitAssignments.orderItemId,
          unassignedAt: orderItemUnitAssignments.unassignedAt,
        })
        .from(orderItemUnitAssignments)
        .where(eq(orderItemUnitAssignments.inventoryUnitId, matchedUnit.unitId))
        .limit(1)

      if (
        existingAssignment &&
        existingAssignment.orderId === orderId &&
        existingAssignment.orderItemId === orderItemId &&
        existingAssignment.unassignedAt === null
      ) {
        return { success: true as const }
      }

      if (existingAssignment && existingAssignment.unassignedAt === null) {
        return {
          success: false as const,
          error: "This unit is already assigned to another order line",
        }
      }

      if (
        matchedUnit.unitStatus !== "available" &&
        matchedUnit.unitStatus !== "received" &&
        matchedUnit.unitStatus !== "returned"
      ) {
        return {
          success: false as const,
          error: `Scanned unit is not available for packing (${matchedUnit.unitStatus})`,
        }
      }

      await allocateInventory(
        {
          variantId: item.variantId,
          quantity: 1,
          unitIds: [matchedUnit.unitId],
          referenceType: "order_item",
          referenceId: item.id,
          notes: `Allocated scanned unit for order ${order.orderNumber}`,
        },
        { tx },
      )

      if (existingAssignment) {
        await tx
          .update(orderItemUnitAssignments)
          .set({
            orderId,
            orderItemId,
            assignedAt: new Date(),
            unassignedAt: null,
            updatedAt: new Date(),
          })
          .where(eq(orderItemUnitAssignments.id, existingAssignment.id))
      } else {
        await tx.insert(orderItemUnitAssignments).values({
          orderId,
          orderItemId,
          inventoryUnitId: matchedUnit.unitId,
        })
      }

      await tx
        .update(inventoryUnits)
        .set({
          allocatedOrderId: orderId,
          allocatedOrderItemId: orderItemId,
          updatedAt: new Date(),
        })
        .where(eq(inventoryUnits.id, matchedUnit.unitId))

      return { success: true as const }
    })
  } catch (error) {
    console.error("Failed to scan order packing unit:", error)
    return {
      success: false as const,
      error: "Failed to scan order packing unit",
    }
  }
}

export async function unassignOrderPackingUnit(
  rawInput: z.input<typeof unassignPackingUnitSchema>,
) {
  try {
    await requireStaff()
    const { orderId, orderItemId, inventoryUnitId } =
      unassignPackingUnitSchema.parse(rawInput)

    return db.transaction(async (tx) => {
      const order = await getOrderAggregate(tx, orderId)

      if (!order) {
        return { success: false as const, error: "Order not found" }
      }

      if (order.status !== "packing") {
        return {
          success: false as const,
          error: "Only packing orders can unassign serialized units",
        }
      }

      const item = order.items.find((candidate) => candidate.id === orderItemId)

      if (!item || !item.variantId || item.packing.trackingMode !== "serial") {
        return { success: false as const, error: "Order item not found" }
      }

      const [assignment] = await tx
        .select({
          id: orderItemUnitAssignments.id,
        })
        .from(orderItemUnitAssignments)
        .where(
          and(
            eq(orderItemUnitAssignments.orderId, orderId),
            eq(orderItemUnitAssignments.orderItemId, orderItemId),
            eq(orderItemUnitAssignments.inventoryUnitId, inventoryUnitId),
            isNull(orderItemUnitAssignments.unassignedAt),
          ),
        )
        .limit(1)

      if (!assignment) {
        return {
          success: false as const,
          error: "Serialized unit assignment not found",
        }
      }

      const [unit] = await tx
        .select({ id: inventoryUnits.id })
        .from(inventoryUnits)
        .where(eq(inventoryUnits.id, inventoryUnitId))
        .limit(1)

      if (!unit) {
        return {
          success: false as const,
          error: "Inventory unit not found",
        }
      }

      await unallocateInventoryToReservation(
        {
          variantId: item.variantId,
          quantity: 1,
          unitIds: [inventoryUnitId],
          referenceType: "order_item",
          referenceId: item.id,
          notes: `Released serialized unit from order ${order.orderNumber}`,
        },
        { tx },
      )

      await tx
        .update(orderItemUnitAssignments)
        .set({
          unassignedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(orderItemUnitAssignments.id, assignment.id))

      await tx
        .update(inventoryUnits)
        .set({
          allocatedOrderId: null,
          allocatedOrderItemId: null,
          updatedAt: new Date(),
        })
        .where(eq(inventoryUnits.id, inventoryUnitId))

      return { success: true as const }
    })
  } catch (error) {
    console.error("Failed to unassign order packing unit:", error)
    return {
      success: false as const,
      error: "Failed to unassign order packing unit",
    }
  }
}

export async function completeOrderPacking(
  rawInput: z.input<typeof completePackingSchema>,
) {
  try {
    const session = await getServerSession()
    await requireStaff()
    const { orderId, notes, carrier, trackingNumber, trackingUrl } =
      completePackingSchema.parse(rawInput)

    const result = await db.transaction(async (tx) => {
      const order = await getOrderAggregate(tx, orderId)

      if (!order) {
        return { success: false as const, error: "Order not found" }
      }

      if (order.status !== "packing") {
        return {
          success: false as const,
          error: "Order must be in packing before shipment",
        }
      }

      if (!order.packing.canComplete) {
        return {
          success: false as const,
          error:
            order.packing.issues[0] ||
            "Packing cannot be completed until all allocations are satisfied",
        }
      }

      for (const item of order.items) {
        if (!item.variantId || !item.packing.manageInventory) {
          continue
        }

        const activeAllocations = item.packing.allocations.filter(
          (allocation) => allocation.releasedAt === null,
        )
        const activeAssignments = item.packing.assignments.filter(
          (assignment) => assignment.unassignedAt === null,
        )

        if (item.packing.trackingMode === "quantity") {
          const allocatedQuantity = activeAllocations.reduce(
            (sum, allocation) => sum + allocation.quantity,
            0,
          )

          if (allocatedQuantity > 0) {
            await shipInventory(
              {
                variantId: item.variantId,
                quantity: allocatedQuantity,
                referenceType: "order",
                referenceId: order.id,
                notes: `Shipped for order ${order.orderNumber}`,
              },
              { tx },
            )

            await tx
              .update(orderItemAllocations)
              .set({
                releasedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(orderItemAllocations.orderItemId, item.id),
                  isNull(orderItemAllocations.releasedAt),
                ),
              )
          }

          continue
        }

        const unitIds = activeAssignments.map(
          (assignment) => assignment.inventoryUnitId,
        )

        if (unitIds.length > 0) {
          await shipInventory(
            {
              variantId: item.variantId,
              quantity: unitIds.length,
              unitIds,
              referenceType: "order_item",
              referenceId: item.id,
              notes: `Shipped serialized units for order ${order.orderNumber}`,
            },
            { tx },
          )

          await tx
            .update(inventoryUnits)
            .set({
              allocatedOrderId: order.id,
              allocatedOrderItemId: item.id,
              packedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(inArray(inventoryUnits.id, unitIds))
        }
      }

      await tx.insert(shipments).values({
        orderId: order.id,
        carrier: carrier || null,
        trackingNumber: trackingNumber || null,
        trackingUrl: trackingUrl || null,
        shippedAt: new Date(),
        notes: notes || null,
      })

      await transitionOrderStatusTx(tx, {
        orderId: order.id,
        currentStatus: order.status,
        nextStatus: "shipped",
        notes,
        changedBy: session?.user?.id ?? null,
      })

      return { success: true as const }
    })

    if (!result.success) {
      return result
    }

    const orderData = await getOrderForEmail(orderId)
    if (orderData) {
      await sendOrderShippedEmail(orderData)
    }

    return { success: true as const }
  } catch (error) {
    console.error("Failed to complete order packing:", error)
    return {
      success: false as const,
      error: "Failed to complete order packing",
    }
  }
}

export async function updateOrderNotes(orderId: string, adminNotes: string) {
  try {
    await requireStaff()

    const [existingOrder] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1)

    if (!existingOrder) {
      return { success: false as const, error: "Order not found" }
    }

    await db
      .update(orders)
      .set({
        adminNotes,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))

    return { success: true as const }
  } catch (error) {
    console.error("Failed to update order notes:", error)
    return { success: false as const, error: "Failed to update order notes" }
  }
}

export async function getOrderStats() {
  try {
    await requireStaff()
    const stats = await db
      .select({
        status: orders.status,
        count: count(),
        total: sql<number>`sum(${orders.total})`,
      })
      .from(orders)
      .groupBy(orders.status)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [todayStats] = await db
      .select({
        count: count(),
        total: sql<number>`sum(${orders.total})`,
      })
      .from(orders)
      .where(gte(orders.createdAt, today))

    return {
      success: true as const,
      data: {
        byStatus: stats,
        today: todayStats,
      },
    }
  } catch (error) {
    console.error("Failed to fetch order stats:", error)
    return { success: false as const, error: "Failed to fetch order stats" }
  }
}
