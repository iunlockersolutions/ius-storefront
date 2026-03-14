import { and, eq, inArray, sql } from "drizzle-orm"

import {
  releaseReservedInventory,
  reserveInventory,
} from "@/lib/actions/inventory"
import { db } from "@/lib/db"
import { inventoryTransactions, orderItems, orders } from "@/lib/db/schema"

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

interface ManagedOrderVariant {
  variantId: string
  quantity: number
}

async function getOrderManagedVariants(
  tx: typeof db | DbTransaction,
  orderId: string,
) {
  const [order] = await tx
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)

  if (!order) {
    throw new Error("Order not found")
  }

  const lines = await tx
    .select({
      variantId: orderItems.variantId,
      quantity: orderItems.quantity,
      snapshot: orderItems.snapshot,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId))

  const totalsByVariant = new Map<string, number>()

  for (const line of lines) {
    if (!line.variantId || !line.snapshot?.manageInventory) {
      continue
    }

    totalsByVariant.set(
      line.variantId,
      (totalsByVariant.get(line.variantId) ?? 0) + line.quantity,
    )
  }

  const variants: ManagedOrderVariant[] = Array.from(
    totalsByVariant.entries(),
    ([variantId, quantity]) => ({
      variantId,
      quantity,
    }),
  )

  return {
    order,
    variants,
  }
}

async function getOrderReservationNetMap(
  tx: typeof db | DbTransaction,
  orderId: string,
  variantIds: string[],
) {
  if (variantIds.length === 0) {
    return new Map<string, number>()
  }

  const rows = await tx
    .select({
      variantId: inventoryTransactions.variantId,
      reservedDelta: sql<number>`COALESCE(SUM(${inventoryTransactions.afterReservedQuantity} - ${inventoryTransactions.beforeReservedQuantity}), 0)::int`,
    })
    .from(inventoryTransactions)
    .where(
      and(
        eq(inventoryTransactions.referenceType, "order"),
        eq(inventoryTransactions.referenceId, orderId),
        inArray(inventoryTransactions.variantId, variantIds),
      ),
    )
    .groupBy(inventoryTransactions.variantId)

  return new Map(rows.map((row) => [row.variantId, row.reservedDelta]))
}

export async function ensureOrderInventoryReservationsTx(
  tx: DbTransaction,
  orderId: string,
  notes?: string,
) {
  const { order, variants } = await getOrderManagedVariants(tx, orderId)
  const reservationNetByVariant = await getOrderReservationNetMap(
    tx,
    orderId,
    variants.map((variant) => variant.variantId),
  )

  for (const variant of variants) {
    const currentReservation =
      reservationNetByVariant.get(variant.variantId) ?? 0
    const missingReservation = Math.max(
      0,
      variant.quantity - currentReservation,
    )

    if (missingReservation === 0) {
      continue
    }

    await reserveInventory(
      {
        variantId: variant.variantId,
        quantity: missingReservation,
        referenceType: "order",
        referenceId: order.id,
        notes: notes ?? `Reserved for order ${order.orderNumber}`,
      },
      { tx },
    )
  }
}

export async function releaseOrderInventoryReservationsTx(
  tx: DbTransaction,
  orderId: string,
  notes?: string,
) {
  const { order, variants } = await getOrderManagedVariants(tx, orderId)
  const reservationNetByVariant = await getOrderReservationNetMap(
    tx,
    orderId,
    variants.map((variant) => variant.variantId),
  )

  for (const variant of variants) {
    const reservedQuantity = reservationNetByVariant.get(variant.variantId) ?? 0

    if (reservedQuantity <= 0) {
      continue
    }

    await releaseReservedInventory(
      {
        variantId: variant.variantId,
        quantity: reservedQuantity,
        referenceType: "order",
        referenceId: order.id,
        notes: notes ?? `Released reservation for order ${order.orderNumber}`,
      },
      { tx },
    )
  }
}
