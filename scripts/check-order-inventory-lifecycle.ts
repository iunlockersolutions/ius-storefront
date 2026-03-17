import { and, eq, inArray, sql } from "drizzle-orm"

import { db } from "../lib/db"
import {
  inventoryLevels,
  inventoryTransactions,
  orderItems,
  orders,
  payments,
  productVariants,
} from "../lib/db/schema"

import "dotenv/config"

const RESERVATION_REQUIRED_STATUSES = [
  "pending_payment",
  "paid",
  "processing",
  "packing",
] as const

const TERMINAL_ZERO_RESERVATION_STATUSES = ["cancelled", "refunded"] as const

const PAYMENT_PENDING_REQUIRED_STATUSES = ["pending_payment"] as const
const PAYMENT_COMPLETED_REQUIRED_STATUSES = ["paid"] as const
const PAYMENT_REFUNDED_REQUIRED_STATUSES = ["refunded"] as const
const PAYMENT_ACTIVE_REQUIRED_STATUSES = [
  "processing",
  "packing",
  "shipped",
  "delivered",
] as const

interface Violation {
  code: string
  orderId?: string
  orderNumber?: string
  variantId?: string
  details: string
}

function toCompositeKey(orderId: string, variantId: string) {
  return `${orderId}:${variantId}`
}

async function main() {
  const violations: Violation[] = []

  const statusScope = [
    ...RESERVATION_REQUIRED_STATUSES,
    ...TERMINAL_ZERO_RESERVATION_STATUSES,
    ...PAYMENT_PENDING_REQUIRED_STATUSES,
    ...PAYMENT_COMPLETED_REQUIRED_STATUSES,
    ...PAYMENT_REFUNDED_REQUIRED_STATUSES,
    ...PAYMENT_ACTIVE_REQUIRED_STATUSES,
  ] as const

  const scopedOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      holdExpiresAt: orders.holdExpiresAt,
    })
    .from(orders)
    .where(inArray(orders.status, [...new Set(statusScope)]))

  const orderById = new Map(scopedOrders.map((order) => [order.id, order]))
  const orderIds = scopedOrders.map((order) => order.id)

  if (orderIds.length === 0) {
    console.log("Lifecycle check passed: no scoped orders")
    process.exit(0)
  }

  const managedLines = await db
    .select({
      orderId: orderItems.orderId,
      variantId: orderItems.variantId,
      quantity: orderItems.quantity,
      manageInventory: productVariants.manageInventory,
    })
    .from(orderItems)
    .leftJoin(productVariants, eq(orderItems.variantId, productVariants.id))
    .where(inArray(orderItems.orderId, orderIds))

  const expectedReservationByOrderVariant = new Map<string, number>()

  for (const line of managedLines) {
    const order = orderById.get(line.orderId)
    if (!order || !line.variantId || !line.manageInventory) {
      continue
    }

    if (
      !RESERVATION_REQUIRED_STATUSES.includes(
        order.status as (typeof RESERVATION_REQUIRED_STATUSES)[number],
      )
    ) {
      continue
    }

    const key = toCompositeKey(line.orderId, line.variantId)
    expectedReservationByOrderVariant.set(
      key,
      (expectedReservationByOrderVariant.get(key) ?? 0) + line.quantity,
    )
  }

  const reservationNetRows = await db
    .select({
      orderId: inventoryTransactions.referenceId,
      variantId: inventoryTransactions.variantId,
      reservedNet: sql<number>`COALESCE(SUM(${inventoryTransactions.afterReservedQuantity} - ${inventoryTransactions.beforeReservedQuantity}), 0)::int`,
    })
    .from(inventoryTransactions)
    .where(
      and(
        eq(inventoryTransactions.referenceType, "order"),
        inArray(inventoryTransactions.referenceId, orderIds),
      ),
    )
    .groupBy(inventoryTransactions.referenceId, inventoryTransactions.variantId)

  const actualReservationByOrderVariant = new Map<string, number>()

  for (const row of reservationNetRows) {
    if (!row.orderId) {
      continue
    }
    actualReservationByOrderVariant.set(
      toCompositeKey(row.orderId, row.variantId),
      row.reservedNet,
    )
  }

  for (const [key, expected] of expectedReservationByOrderVariant.entries()) {
    const [orderId, variantId] = key.split(":")
    const actual = actualReservationByOrderVariant.get(key) ?? 0
    if (expected !== actual) {
      const order = orderById.get(orderId)
      violations.push({
        code: "reservation_mismatch",
        orderId,
        orderNumber: order?.orderNumber,
        variantId,
        details: `expected reserved ${expected}, found ${actual}`,
      })
    }
  }

  for (const order of scopedOrders) {
    if (
      !TERMINAL_ZERO_RESERVATION_STATUSES.includes(
        order.status as (typeof TERMINAL_ZERO_RESERVATION_STATUSES)[number],
      )
    ) {
      continue
    }

    for (const row of reservationNetRows) {
      if (row.orderId !== order.id) {
        continue
      }

      if (row.reservedNet !== 0) {
        violations.push({
          code: "terminal_order_has_reservation",
          orderId: order.id,
          orderNumber: order.orderNumber,
          variantId: row.variantId,
          details: `terminal status ${order.status} has reserved net ${row.reservedNet}`,
        })
      }
    }
  }

  for (const order of scopedOrders) {
    if (
      PAYMENT_PENDING_REQUIRED_STATUSES.includes(
        order.status as (typeof PAYMENT_PENDING_REQUIRED_STATUSES)[number],
      ) &&
      order.holdExpiresAt === null
    ) {
      violations.push({
        code: "pending_payment_missing_hold_expiry",
        orderId: order.id,
        orderNumber: order.orderNumber,
        details: "pending_payment order is missing holdExpiresAt",
      })
    }
  }

  const paymentRows = await db
    .select({
      orderId: payments.orderId,
      pendingCount: sql<number>`SUM(CASE WHEN ${payments.status} IN ('pending', 'processing') THEN 1 ELSE 0 END)::int`,
      completedCount: sql<number>`SUM(CASE WHEN ${payments.status} = 'completed' THEN 1 ELSE 0 END)::int`,
      refundedCount: sql<number>`SUM(CASE WHEN ${payments.status} = 'refunded' THEN 1 ELSE 0 END)::int`,
      activeCount: sql<number>`SUM(CASE WHEN ${payments.status} IN ('pending', 'processing', 'completed', 'refunded') THEN 1 ELSE 0 END)::int`,
    })
    .from(payments)
    .where(inArray(payments.orderId, orderIds))
    .groupBy(payments.orderId)

  const paymentByOrderId = new Map(paymentRows.map((row) => [row.orderId, row]))

  for (const order of scopedOrders) {
    const payment = paymentByOrderId.get(order.id)
    const pendingCount = payment?.pendingCount ?? 0
    const completedCount = payment?.completedCount ?? 0
    const refundedCount = payment?.refundedCount ?? 0
    const activeCount = payment?.activeCount ?? 0

    if (
      PAYMENT_PENDING_REQUIRED_STATUSES.includes(
        order.status as (typeof PAYMENT_PENDING_REQUIRED_STATUSES)[number],
      ) &&
      pendingCount === 0
    ) {
      violations.push({
        code: "pending_payment_missing_pending_payment_row",
        orderId: order.id,
        orderNumber: order.orderNumber,
        details: "expected at least one pending/processing payment row",
      })
    }

    if (
      PAYMENT_COMPLETED_REQUIRED_STATUSES.includes(
        order.status as (typeof PAYMENT_COMPLETED_REQUIRED_STATUSES)[number],
      ) &&
      completedCount === 0
    ) {
      violations.push({
        code: "paid_order_missing_completed_payment",
        orderId: order.id,
        orderNumber: order.orderNumber,
        details: "expected at least one completed payment row",
      })
    }

    if (
      PAYMENT_REFUNDED_REQUIRED_STATUSES.includes(
        order.status as (typeof PAYMENT_REFUNDED_REQUIRED_STATUSES)[number],
      ) &&
      refundedCount === 0
    ) {
      violations.push({
        code: "refunded_order_missing_refunded_payment",
        orderId: order.id,
        orderNumber: order.orderNumber,
        details: "expected at least one refunded payment row",
      })
    }

    if (
      PAYMENT_ACTIVE_REQUIRED_STATUSES.includes(
        order.status as (typeof PAYMENT_ACTIVE_REQUIRED_STATUSES)[number],
      ) &&
      activeCount === 0
    ) {
      violations.push({
        code: "active_fulfillment_order_missing_payment",
        orderId: order.id,
        orderNumber: order.orderNumber,
        details: `status ${order.status} expected at least one active payment row`,
      })
    }
  }

  const inventoryLevelMismatches = await db
    .select({
      variantId: inventoryLevels.variantId,
      onHandQuantity: inventoryLevels.onHandQuantity,
      reservedQuantity: inventoryLevels.reservedQuantity,
      allocatedQuantity: inventoryLevels.allocatedQuantity,
      availableQuantity: inventoryLevels.availableQuantity,
      expectedAvailable: sql<number>`${inventoryLevels.onHandQuantity} - ${inventoryLevels.reservedQuantity} - ${inventoryLevels.allocatedQuantity}`,
    })
    .from(inventoryLevels)
    .where(
      sql`${inventoryLevels.availableQuantity} != ${inventoryLevels.onHandQuantity} - ${inventoryLevels.reservedQuantity} - ${inventoryLevels.allocatedQuantity}`,
    )

  for (const level of inventoryLevelMismatches) {
    violations.push({
      code: "inventory_available_mismatch",
      variantId: level.variantId,
      details: `available ${level.availableQuantity}, expected ${level.expectedAvailable} (on_hand ${level.onHandQuantity}, reserved ${level.reservedQuantity}, allocated ${level.allocatedQuantity})`,
    })
  }

  if (violations.length === 0) {
    console.log("Lifecycle check passed")
    console.log(`- scopedOrders: ${scopedOrders.length}`)
    console.log(`- reservationRows: ${reservationNetRows.length}`)
    console.log(`- paymentRows: ${paymentRows.length}`)
    console.log(`- inventoryMismatches: ${inventoryLevelMismatches.length}`)
    process.exit(0)
  }

  console.error("Lifecycle check failed")
  console.error(`- scopedOrders: ${scopedOrders.length}`)
  console.error(`- violations: ${violations.length}`)

  for (const violation of violations.slice(0, 200)) {
    console.error(
      JSON.stringify({
        code: violation.code,
        orderId: violation.orderId,
        orderNumber: violation.orderNumber,
        variantId: violation.variantId,
        details: violation.details,
      }),
    )
  }

  process.exit(1)
}

main().catch((error) => {
  console.error("Lifecycle check script failed", error)
  process.exit(1)
})
