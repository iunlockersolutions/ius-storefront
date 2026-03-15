import { and, asc, eq, inArray, isNull } from "drizzle-orm"

import { db } from "../lib/db"
import { orders } from "../lib/db/schema"
import { ensureOrderInventoryReservationsTx } from "../lib/orders/inventory-reservations"

import "dotenv/config"

const HOLD_STATUSES = ["draft", "pending_payment"] as const
const RESERVATION_STATUSES = [
  "pending_payment",
  "paid",
  "processing",
  "packing",
] as const

const DEFAULT_HOLD_TIMEOUT_MINUTES = 60

function parseArgs() {
  const args = new Set(process.argv.slice(2))

  return {
    dryRun: args.has("--dry-run"),
  }
}

function getHoldTimeoutMinutes() {
  const raw = Number(process.env.ORDER_HOLD_TIMEOUT_MINUTES)
  if (!Number.isFinite(raw) || raw <= 0) {
    return DEFAULT_HOLD_TIMEOUT_MINUTES
  }

  return Math.floor(raw)
}

async function main() {
  const { dryRun } = parseArgs()
  const holdTimeoutMinutes = getHoldTimeoutMinutes()

  const targetOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      holdExpiresAt: orders.holdExpiresAt,
    })
    .from(orders)
    .where(inArray(orders.status, [...HOLD_STATUSES, ...RESERVATION_STATUSES]))
    .orderBy(asc(orders.createdAt))

  let holdUpdates = 0
  let reservationEnsures = 0

  for (const order of targetOrders) {
    const needsHoldExpiry =
      HOLD_STATUSES.includes(order.status as (typeof HOLD_STATUSES)[number]) &&
      order.holdExpiresAt === null
    const needsReservationEnsure = RESERVATION_STATUSES.includes(
      order.status as (typeof RESERVATION_STATUSES)[number],
    )

    if (!needsHoldExpiry && !needsReservationEnsure) {
      continue
    }

    if (dryRun) {
      if (needsHoldExpiry) {
        holdUpdates += 1
      }
      if (needsReservationEnsure) {
        reservationEnsures += 1
      }
      continue
    }

    await db.transaction(async (tx) => {
      const [lockedOrder] = await tx
        .select({
          id: orders.id,
          status: orders.status,
        })
        .from(orders)
        .where(eq(orders.id, order.id))
        .limit(1)
        .for("update")

      if (!lockedOrder) {
        return
      }

      if (
        HOLD_STATUSES.includes(
          lockedOrder.status as (typeof HOLD_STATUSES)[number],
        )
      ) {
        const [missingHold] = await tx
          .select({ id: orders.id })
          .from(orders)
          .where(and(eq(orders.id, order.id), isNull(orders.holdExpiresAt)))
          .limit(1)

        if (missingHold) {
          await tx
            .update(orders)
            .set({
              holdExpiresAt: new Date(Date.now() + holdTimeoutMinutes * 60_000),
              updatedAt: new Date(),
            })
            .where(eq(orders.id, order.id))

          holdUpdates += 1
        }
      }

      if (
        RESERVATION_STATUSES.includes(
          lockedOrder.status as (typeof RESERVATION_STATUSES)[number],
        )
      ) {
        await ensureOrderInventoryReservationsTx(
          tx,
          order.id,
          `Backfilled reservation consistency for order ${order.orderNumber}`,
        )
        reservationEnsures += 1
      }
    })
  }

  console.log("Backfill complete")
  console.log(`- dryRun: ${dryRun}`)
  console.log(`- scannedOrders: ${targetOrders.length}`)
  console.log(`- holdUpdates: ${holdUpdates}`)
  console.log(`- reservationEnsures: ${reservationEnsures}`)
}

main().catch((error) => {
  console.error("Backfill failed", error)
  process.exit(1)
})
