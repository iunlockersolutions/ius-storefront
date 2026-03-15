import { and, asc, eq, inArray, isNotNull, lte } from "drizzle-orm"

import { db } from "@/lib/db"
import { orders, orderStatusHistory } from "@/lib/db/schema"
import { releaseOrderInventoryReservationsTx } from "@/lib/orders/inventory-reservations"

const HOLD_EXPIRY_CANCELLABLE_STATUSES = ["draft", "pending_payment"] as const

export interface ReleaseExpiredOrderHoldsResult {
  now: string
  scanned: number
  released: number
  orderIds: string[]
}

export async function releaseExpiredOrderHolds(
  limit = 100,
): Promise<ReleaseExpiredOrderHoldsResult> {
  const now = new Date()

  return db.transaction(async (tx) => {
    const expiredOrders = await tx
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
      })
      .from(orders)
      .where(
        and(
          isNotNull(orders.holdExpiresAt),
          lte(orders.holdExpiresAt, now),
          inArray(orders.status, [...HOLD_EXPIRY_CANCELLABLE_STATUSES]),
        ),
      )
      .orderBy(asc(orders.holdExpiresAt))
      .limit(limit)

    for (const order of expiredOrders) {
      await releaseOrderInventoryReservationsTx(
        tx,
        order.id,
        `Released after hold expiry for order ${order.orderNumber}`,
      )

      await tx
        .update(orders)
        .set({
          status: "cancelled",
          holdExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id))

      await tx.insert(orderStatusHistory).values({
        orderId: order.id,
        fromStatus: order.status,
        toStatus: "cancelled",
        notes: "Order hold expired and inventory reservation was released",
      })
    }

    return {
      now: now.toISOString(),
      scanned: expiredOrders.length,
      released: expiredOrders.length,
      orderIds: expiredOrders.map((order) => order.id),
    }
  })
}
