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
  bankTransferProofs,
  inventoryUnitIdentifiers,
  inventoryUnits,
  orderItemAllocations,
  orderItems,
  orderItemUnitAssignments,
  orders,
  orderStatusHistory,
  payments,
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
  AdminOrderFulfillmentStatus,
  AdminOrderItem,
  AdminOrderListItem,
  AdminOrderListView,
  AdminOrderPaymentStatus,
  AdminOrderShipment,
  AdminOrderStatus,
  AdminOrderUnitAssignment,
} from "@/lib/types/admin-order"
import { formatCurrency } from "@/lib/utils"
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
  paymentStatus: z
    .enum([
      "unpaid",
      "pending_verification",
      "authorized",
      "paid",
      "failed",
      "refunded",
      "cancelled",
    ])
    .optional(),
  fulfillmentStatus: z
    .enum([
      "confirmed",
      "processing",
      "packing",
      "shipped",
      "delivered",
      "cancelled",
    ])
    .optional(),
  customerType: z.enum(["all", "guest", "registered"]).default("all"),
  shippingMethod: z.string().trim().optional(),
  view: z
    .enum([
      "all",
      "needs_payment_review",
      "awaiting_processing",
      "needs_serial_assignment",
      "ready_to_ship",
      "delivered",
      "exceptions",
    ])
    .default("all"),
  sortBy: z
    .enum([
      "createdAt",
      "updatedAt",
      "latestActivityAt",
      "total",
      "customer",
      "paymentStatus",
      "fulfillmentStatus",
      "orderNumber",
    ])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
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

interface OrderListLineSnapshot {
  orderId: string
  orderItemId: string
  quantity: number
  trackingMode: "quantity" | "serial" | null
  manageInventory: boolean
  allocatedQuantity: number
  assignedUnitCount: number
}

function normalizeIdentifierValue(value: string) {
  return value.trim().toLowerCase()
}

function isValidTransition(from: AdminOrderStatus, to: AdminOrderStatus) {
  return ORDER_VALID_TRANSITIONS[from]?.includes(to) ?? false
}

function deriveFulfillmentStatus(status: AdminOrderStatus) {
  switch (status) {
    case "processing":
      return "processing" as const
    case "packing":
      return "packing" as const
    case "shipped":
      return "shipped" as const
    case "delivered":
      return "delivered" as const
    case "cancelled":
    case "refunded":
      return "cancelled" as const
    default:
      return "confirmed" as const
  }
}

function buildLineProgress(
  line: Pick<
    OrderListLineSnapshot,
    | "quantity"
    | "trackingMode"
    | "manageInventory"
    | "allocatedQuantity"
    | "assignedUnitCount"
  >,
  orderStatus: AdminOrderStatus,
) {
  if (!line.manageInventory) {
    return {
      committedQuantity: 0,
      preparingQuantity: 0,
      readyToShipQuantity: line.quantity,
      remainingToAssign: 0,
      remainingToShip:
        orderStatus === "shipped" ||
        orderStatus === "delivered" ||
        orderStatus === "refunded"
          ? 0
          : line.quantity,
      isReadyToShip: true,
      blockedReason: null,
    }
  }

  const committedQuantity =
    orderStatus === "cancelled" || orderStatus === "refunded"
      ? 0
      : line.quantity

  if (line.trackingMode === "serial") {
    const readyToShipQuantity =
      orderStatus === "shipped" ||
      orderStatus === "delivered" ||
      orderStatus === "refunded"
        ? line.quantity
        : line.assignedUnitCount

    const remainingToAssign = Math.max(
      0,
      line.quantity - line.assignedUnitCount,
    )

    return {
      committedQuantity,
      preparingQuantity: line.assignedUnitCount,
      readyToShipQuantity,
      remainingToAssign,
      remainingToShip: Math.max(0, line.quantity - readyToShipQuantity),
      isReadyToShip: readyToShipQuantity >= line.quantity,
      blockedReason:
        remainingToAssign > 0
          ? `Assign ${remainingToAssign} more serialized unit(s)`
          : null,
    }
  }

  const preparingQuantity =
    orderStatus === "shipped" ||
    orderStatus === "delivered" ||
    orderStatus === "refunded"
      ? line.quantity
      : line.allocatedQuantity
  const remainingToAllocate = Math.max(
    0,
    line.quantity - line.allocatedQuantity,
  )

  return {
    committedQuantity,
    preparingQuantity,
    readyToShipQuantity: preparingQuantity,
    remainingToAssign: 0,
    remainingToShip: Math.max(0, line.quantity - preparingQuantity),
    isReadyToShip: preparingQuantity >= line.quantity,
    blockedReason:
      remainingToAllocate > 0
        ? `Allocate ${remainingToAllocate} more unit(s)`
        : null,
  }
}

function buildOrderProgressSummary(
  lines: OrderListLineSnapshot[],
  orderStatus: AdminOrderStatus,
) {
  let readyLines = 0
  let serialLines = 0
  let serialAssignedUnits = 0
  let serialRequiredUnits = 0
  let quantityLines = 0
  let allocatedQuantityUnits = 0
  let committedQuantityUnits = 0

  for (const line of lines) {
    const progress = buildLineProgress(line, orderStatus)
    committedQuantityUnits += progress.committedQuantity

    if (progress.isReadyToShip) {
      readyLines += 1
    }

    if (!line.manageInventory) {
      continue
    }

    if (line.trackingMode === "serial") {
      serialLines += 1
      serialAssignedUnits += line.assignedUnitCount
      serialRequiredUnits += line.quantity
    } else if (line.trackingMode === "quantity") {
      quantityLines += 1
      allocatedQuantityUnits += Math.min(line.quantity, line.allocatedQuantity)
    }
  }

  const attentionState: AdminOrderListItem["progress"]["attentionState"] =
    orderStatus === "cancelled" || orderStatus === "refunded"
      ? "exception"
      : null

  return {
    totalLines: lines.length,
    readyLines,
    serialLines,
    serialAssignedUnits,
    serialRequiredUnits,
    quantityLines,
    allocatedQuantityUnits,
    committedQuantityUnits,
    canShipNow: lines.length > 0 && readyLines === lines.length,
    attentionState,
  }
}

function resolveOrderAttentionState(
  order: Pick<
    AdminOrderListItem,
    "status" | "paymentStatus" | "paymentMethod" | "progress"
  >,
): AdminOrderListItem["progress"]["attentionState"] {
  if (order.status === "cancelled" || order.status === "refunded") {
    return "exception"
  }

  if (
    order.paymentMethod === "bank_transfer" &&
    order.paymentStatus === "pending_verification"
  ) {
    return "needs_payment_review"
  }

  if (order.status === "paid" || order.status === "processing") {
    return "awaiting_processing"
  }

  if (
    order.status === "packing" &&
    order.progress.serialLines > 0 &&
    order.progress.serialAssignedUnits < order.progress.serialRequiredUnits
  ) {
    return "needs_serial_assignment"
  }

  if (order.status === "packing" && order.progress.canShipNow) {
    return "ready_to_ship"
  }

  return null
}

async function getOrderBase(tx: typeof db | DbTransaction, orderId: string) {
  const [order] = await tx
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      fulfillmentStatus: orders.fulfillmentStatus,
      paymentMethod: orders.paymentMethod,
      shippingMethod: orders.shippingMethod,
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
      placedAt: orders.placedAt,
      confirmedAt: orders.confirmedAt,
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

    if (!item.variantId) {
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
    paymentRows,
    paymentProofRows,
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
        snapshot: orderItems.snapshot,
        variant: {
          id: productVariants.id,
          name: productVariants.name,
          sku: productVariants.sku,
        },
      })
      .from(orderItems)
      .leftJoin(productVariants, eq(orderItems.variantId, productVariants.id))
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
    tx
      .select({
        id: payments.id,
        method: payments.method,
        status: payments.status,
        amount: payments.amount,
        currency: payments.currency,
        externalId: payments.externalId,
        externalStatus: payments.externalStatus,
        failureReason: payments.failureReason,
        processedAt: payments.processedAt,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .orderBy(desc(payments.createdAt)),
    tx
      .select({
        id: bankTransferProofs.id,
        paymentId: bankTransferProofs.paymentId,
        fileUrl: bankTransferProofs.fileUrl,
        fileName: bankTransferProofs.fileName,
        notes: bankTransferProofs.notes,
        verifiedAt: bankTransferProofs.verifiedAt,
        verificationNotes: bankTransferProofs.verificationNotes,
        isApproved: bankTransferProofs.isApproved,
        createdAt: bankTransferProofs.createdAt,
      })
      .from(bankTransferProofs)
      .innerJoin(payments, eq(bankTransferProofs.paymentId, payments.id))
      .where(eq(payments.orderId, orderId))
      .orderBy(desc(bankTransferProofs.createdAt)),
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
    const trackingMode = item.snapshot?.trackingMode ?? null
    const manageInventory = item.snapshot?.manageInventory ?? false
    const progress = buildLineProgress(
      {
        quantity: item.quantity,
        trackingMode,
        manageInventory,
        allocatedQuantity,
        assignedUnitCount,
      },
      order.status,
    )

    return {
      id: item.id,
      variantId: item.variantId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
      productName: item.productName,
      variantName: item.variantName,
      sku: item.sku,
      snapshot: item.snapshot,
      variant: item.variantId
        ? {
            id: item.variant?.id ?? item.variantId,
            name:
              item.variant?.name ??
              item.snapshot?.variantName ??
              item.variantName,
            sku: item.variant?.sku ?? item.snapshot?.sku ?? item.sku,
            trackingMode,
            manageInventory,
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
      progress,
    }
  })

  const proofsByPaymentId = new Map<
    string,
    AdminOrder["payments"][number]["proofs"]
  >()
  for (const proof of paymentProofRows) {
    const existing = proofsByPaymentId.get(proof.paymentId) ?? []
    existing.push({
      id: proof.id,
      fileUrl: proof.fileUrl,
      fileName: proof.fileName,
      notes: proof.notes,
      verifiedAt: proof.verifiedAt,
      verificationNotes: proof.verificationNotes,
      isApproved: proof.isApproved,
      createdAt: proof.createdAt,
    })
    proofsByPaymentId.set(proof.paymentId, existing)
  }

  return {
    ...order,
    payments: paymentRows.map((payment) => ({
      ...payment,
      proofs: proofsByPaymentId.get(payment.id) ?? [],
    })),
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
      fulfillmentStatus: deriveFulfillmentStatus(input.nextStatus),
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

    if (item.packing.trackingMode === "quantity" && item.quantity > 0) {
      await releaseReservedInventory(
        {
          variantId: item.variantId,
          quantity: item.quantity,
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

    if (item.packing.trackingMode === "serial" && item.quantity > 0) {
      await releaseReservedInventory(
        {
          variantId: item.variantId,
          quantity: item.quantity,
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
    total: formatCurrency(order.total),
    items: items.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
      price: formatCurrency(item.unitPrice),
    })),
    shippingAddress: order.shippingAddress as OrderEmailData["shippingAddress"],
  }
}

export async function getOrders(input?: Partial<OrderFilterInput>) {
  try {
    await requireStaff()
    const {
      status,
      paymentStatus,
      fulfillmentStatus,
      customerType,
      shippingMethod,
      view,
      sortBy,
      sortOrder,
      search,
      startDate,
      endDate,
      page,
      limit,
    } = orderFilterSchema.parse(input ?? {})

    const conditions = []

    if (status) {
      conditions.push(eq(orders.status, status))
    }

    if (paymentStatus) {
      conditions.push(eq(orders.paymentStatus, paymentStatus))
    }

    if (fulfillmentStatus) {
      conditions.push(eq(orders.fulfillmentStatus, fulfillmentStatus))
    }

    if (customerType === "guest") {
      conditions.push(isNull(orders.userId))
    }

    if (customerType === "registered") {
      conditions.push(sql`${orders.userId} IS NOT NULL`)
    }

    if (shippingMethod) {
      conditions.push(eq(orders.shippingMethod, shippingMethod))
    }

    if (search) {
      const searchValue = `%${search}%`
      conditions.push(
        or(
          ilike(orders.orderNumber, searchValue),
          ilike(orders.customerEmail, searchValue),
          ilike(orders.customerName, searchValue),
          ilike(orders.customerPhone, searchValue),
          ilike(user.email, searchValue),
          ilike(user.name, searchValue),
          sql<boolean>`EXISTS (
            SELECT 1
            FROM ${orderItems} AS oi
            WHERE oi.order_id = ${orders.id}
              AND (
                oi.product_name ILIKE ${searchValue}
                OR oi.variant_name ILIKE ${searchValue}
                OR oi.sku ILIKE ${searchValue}
              )
          )`,
          sql<boolean>`EXISTS (
            SELECT 1
            FROM ${shipments} AS shipment
            WHERE shipment.order_id = ${orders.id}
              AND (
                shipment.tracking_number ILIKE ${searchValue}
                OR shipment.carrier ILIKE ${searchValue}
              )
          )`,
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

    const baseOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        fulfillmentStatus: orders.fulfillmentStatus,
        paymentMethod: orders.paymentMethod,
        shippingMethod: orders.shippingMethod,
        total: orders.total,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        customerEmail: orders.customerEmail,
        customerName: orders.customerName,
        customerPhone: orders.customerPhone,
        customer: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
      .from(orders)
      .leftJoin(user, eq(orders.userId, user.id))
      .where(whereClause)

    const orderIds = baseOrders.map((order) => order.id)

    const [listItemRows, allocationRows, assignmentRows, shipmentRows] =
      orderIds.length > 0
        ? await Promise.all([
            db
              .select({
                orderId: orderItems.orderId,
                orderItemId: orderItems.id,
                quantity: orderItems.quantity,
                trackingMode: sql<
                  "quantity" | "serial" | null
                >`${orderItems.snapshot} ->> 'trackingMode'`,
                manageInventory: sql<boolean>`COALESCE((${orderItems.snapshot} ->> 'manageInventory')::boolean, false)`,
              })
              .from(orderItems)
              .where(inArray(orderItems.orderId, orderIds)),
            db
              .select({
                orderItemId: orderItemAllocations.orderItemId,
                quantity: orderItemAllocations.quantity,
                releasedAt: orderItemAllocations.releasedAt,
              })
              .from(orderItemAllocations)
              .where(inArray(orderItemAllocations.orderId, orderIds)),
            db
              .select({
                orderItemId: orderItemUnitAssignments.orderItemId,
                unassignedAt: orderItemUnitAssignments.unassignedAt,
              })
              .from(orderItemUnitAssignments)
              .where(inArray(orderItemUnitAssignments.orderId, orderIds)),
            db
              .select({
                orderId: shipments.orderId,
                carrier: shipments.carrier,
                trackingNumber: shipments.trackingNumber,
                createdAt: shipments.createdAt,
              })
              .from(shipments)
              .where(inArray(shipments.orderId, orderIds))
              .orderBy(desc(shipments.createdAt)),
          ])
        : [[], [], [], []]

    const activeAllocationQuantityByItemId = new Map<string, number>()
    for (const allocation of allocationRows) {
      if (allocation.releasedAt !== null) {
        continue
      }

      activeAllocationQuantityByItemId.set(
        allocation.orderItemId,
        (activeAllocationQuantityByItemId.get(allocation.orderItemId) ?? 0) +
          allocation.quantity,
      )
    }

    const activeAssignmentCountByItemId = new Map<string, number>()
    for (const assignment of assignmentRows) {
      if (assignment.unassignedAt !== null) {
        continue
      }

      activeAssignmentCountByItemId.set(
        assignment.orderItemId,
        (activeAssignmentCountByItemId.get(assignment.orderItemId) ?? 0) + 1,
      )
    }

    const linesByOrderId = new Map<string, OrderListLineSnapshot[]>()
    for (const item of listItemRows) {
      const existing = linesByOrderId.get(item.orderId) ?? []
      existing.push({
        orderId: item.orderId,
        orderItemId: item.orderItemId,
        quantity: item.quantity,
        trackingMode: item.trackingMode,
        manageInventory: item.manageInventory,
        allocatedQuantity:
          activeAllocationQuantityByItemId.get(item.orderItemId) ?? 0,
        assignedUnitCount:
          activeAssignmentCountByItemId.get(item.orderItemId) ?? 0,
      })
      linesByOrderId.set(item.orderId, existing)
    }

    const latestShipmentByOrderId = new Map<
      string,
      { trackingNumber: string | null; carrier: string | null; createdAt: Date }
    >()
    for (const shipment of shipmentRows) {
      if (!latestShipmentByOrderId.has(shipment.orderId)) {
        latestShipmentByOrderId.set(shipment.orderId, shipment)
      }
    }

    const enrichedOrders: AdminOrderListItem[] = baseOrders.map((order) => {
      const lines = linesByOrderId.get(order.id) ?? []
      const progress = buildOrderProgressSummary(lines, order.status)
      const latestShipment = latestShipmentByOrderId.get(order.id) ?? null
      const latestActivityAt = latestShipment
        ? new Date(
            Math.max(
              new Date(order.updatedAt).getTime(),
              new Date(latestShipment.createdAt).getTime(),
            ),
          )
        : order.updatedAt

      const listItem: AdminOrderListItem = {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus as AdminOrderPaymentStatus,
        fulfillmentStatus:
          order.fulfillmentStatus as AdminOrderFulfillmentStatus,
        paymentMethod: order.paymentMethod,
        shippingMethod: order.shippingMethod,
        total: order.total,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        latestActivityAt,
        customer: order.customer,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        isGuest: !order.customer?.id,
        itemCount: lines.length,
        totalQuantity: lines.reduce((sum, line) => sum + line.quantity, 0),
        latestTrackingNumber: latestShipment?.trackingNumber ?? null,
        latestCarrier: latestShipment?.carrier ?? null,
        progress: {
          ...progress,
          attentionState: null,
        },
      }

      listItem.progress.attentionState = resolveOrderAttentionState(listItem)
      return listItem
    })

    const viewedOrders = enrichedOrders.filter((order) => {
      switch (view) {
        case "needs_payment_review":
          return order.progress.attentionState === "needs_payment_review"
        case "awaiting_processing":
          return order.progress.attentionState === "awaiting_processing"
        case "needs_serial_assignment":
          return order.progress.attentionState === "needs_serial_assignment"
        case "ready_to_ship":
          return order.progress.attentionState === "ready_to_ship"
        case "delivered":
          return order.status === "delivered"
        case "exceptions":
          return order.progress.attentionState === "exception"
        case "all":
        default:
          return true
      }
    })

    const sortDirection = sortOrder === "asc" ? 1 : -1
    const sortedOrders = [...viewedOrders].sort((left, right) => {
      const compare = (() => {
        switch (sortBy) {
          case "updatedAt":
            return (
              new Date(left.updatedAt).getTime() -
              new Date(right.updatedAt).getTime()
            )
          case "latestActivityAt":
            return (
              new Date(left.latestActivityAt).getTime() -
              new Date(right.latestActivityAt).getTime()
            )
          case "total":
            return (
              Number.parseFloat(left.total) - Number.parseFloat(right.total)
            )
          case "customer":
            return (left.customerName || left.customerEmail).localeCompare(
              right.customerName || right.customerEmail,
            )
          case "paymentStatus":
            return left.paymentStatus.localeCompare(right.paymentStatus)
          case "fulfillmentStatus":
            return left.fulfillmentStatus.localeCompare(right.fulfillmentStatus)
          case "orderNumber":
            return left.orderNumber.localeCompare(right.orderNumber)
          case "createdAt":
          default:
            return (
              new Date(left.createdAt).getTime() -
              new Date(right.createdAt).getTime()
            )
        }
      })()

      if (compare !== 0) {
        return compare * sortDirection
      }

      return right.orderNumber.localeCompare(left.orderNumber)
    })

    const offset = (page - 1) * limit
    const paginatedOrders = sortedOrders.slice(offset, offset + limit)

    return {
      success: true as const,
      data: {
        orders: paginatedOrders,
        pagination: {
          page,
          limit,
          total: sortedOrders.length,
          totalPages: Math.max(1, Math.ceil(sortedOrders.length / limit)),
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

      if (!item || !item.variantId) {
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
