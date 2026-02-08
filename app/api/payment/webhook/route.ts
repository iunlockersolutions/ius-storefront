import { NextRequest, NextResponse } from "next/server"

import crypto from "crypto"
import { eq } from "drizzle-orm"

import { db } from "@/lib/db"
import {
  inventoryItems,
  inventoryMovements,
  orderItems,
  orders,
  orderStatusHistory,
  payments,
} from "@/lib/db/schema"

// DirectPay webhook secret for signature verification
const WEBHOOK_SECRET =
  process.env.DIRECTPAY_WEBHOOK_SECRET || "test_webhook_secret"

interface WebhookPayload {
  event: "payment.completed" | "payment.failed" | "payment.cancelled"
  sessionId: string
  transactionId?: string
  orderId: string
  amount: number
  currency: string
  status: string
  timestamp: string
  cardLast4?: string
  cardBrand?: string
}

function verifySignature(payload: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(payload)
    .digest("hex")

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  )
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text()
    const signature = request.headers.get("x-webhook-signature") || ""

    // Verify webhook signature (skip in development if signature not provided)
    if (signature && process.env.NODE_ENV === "production") {
      if (!verifySignature(payload, signature)) {
        console.error("Invalid webhook signature")
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 },
        )
      }
    }

    const data: WebhookPayload = JSON.parse(payload)
    console.log("Payment webhook received:", data.event, data.sessionId)

    // Find payment by session ID
    const payment = await db.query.payments.findFirst({
      where: eq(payments.externalId, data.sessionId),
    })

    if (!payment) {
      console.error("Payment not found for session:", data.sessionId)
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Skip if already processed
    if (payment.status === "completed" || payment.status === "failed") {
      console.log("Payment already processed:", payment.id)
      return NextResponse.json({ success: true, message: "Already processed" })
    }

    // Process based on event type
    switch (data.event) {
      case "payment.completed":
        await handlePaymentCompleted(payment, data)
        break
      case "payment.failed":
        await handlePaymentFailed(payment, data)
        break
      case "payment.cancelled":
        await handlePaymentCancelled(payment, data)
        break
      default:
        console.log("Unknown webhook event:", data.event)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}

async function handlePaymentCompleted(
  payment: typeof payments.$inferSelect,
  data: WebhookPayload,
) {
  await db.transaction(async (tx) => {
    // Update payment
    await tx
      .update(payments)
      .set({
        status: "completed",
        externalStatus: data.status,
        processedAt: new Date(data.timestamp),
        metadata: JSON.stringify({
          transactionId: data.transactionId,
          cardLast4: data.cardLast4,
          cardBrand: data.cardBrand,
        }),
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id))

    // Update order status
    await tx
      .update(orders)
      .set({ status: "paid", updatedAt: new Date() })
      .where(eq(orders.id, payment.orderId))

    // Add status history
    await tx.insert(orderStatusHistory).values({
      orderId: payment.orderId,
      fromStatus: "pending_payment",
      toStatus: "paid",
      notes: `Payment completed via card (${data.cardBrand} ****${data.cardLast4})`,
    })

    // Convert reserved inventory to sold
    const items = await tx
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, payment.orderId))

    for (const item of items) {
      if (!item.variantId) continue

      const [inventory] = await tx
        .select()
        .from(inventoryItems)
        .where(eq(inventoryItems.variantId, item.variantId))
        .for("update")

      if (inventory) {
        const newQuantity = inventory.quantity - item.quantity
        const newReserved = Math.max(
          0,
          inventory.reservedQuantity - item.quantity,
        )

        await tx
          .update(inventoryItems)
          .set({
            quantity: newQuantity,
            reservedQuantity: newReserved,
            updatedAt: new Date(),
          })
          .where(eq(inventoryItems.id, inventory.id))

        await tx.insert(inventoryMovements).values({
          inventoryItemId: inventory.id,
          type: "sale",
          quantity: -item.quantity,
          previousQuantity: inventory.quantity,
          newQuantity,
          referenceType: "order",
          referenceId: payment.orderId,
          notes: `Sold - Payment webhook confirmed`,
        })
      }
    }
  })

  console.log("Payment completed processed:", payment.id)
}

async function handlePaymentFailed(
  payment: typeof payments.$inferSelect,
  data: WebhookPayload,
) {
  await db.transaction(async (tx) => {
    // Update payment
    await tx
      .update(payments)
      .set({
        status: "failed",
        externalStatus: data.status,
        failureReason: "Payment declined by payment provider",
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id))

    // Release reserved inventory
    const items = await tx
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, payment.orderId))

    for (const item of items) {
      if (!item.variantId) continue

      const [inventory] = await tx
        .select()
        .from(inventoryItems)
        .where(eq(inventoryItems.variantId, item.variantId))
        .for("update")

      if (inventory) {
        const newReserved = Math.max(
          0,
          inventory.reservedQuantity - item.quantity,
        )

        await tx
          .update(inventoryItems)
          .set({
            reservedQuantity: newReserved,
            updatedAt: new Date(),
          })
          .where(eq(inventoryItems.id, inventory.id))

        await tx.insert(inventoryMovements).values({
          inventoryItemId: inventory.id,
          type: "released",
          quantity: item.quantity,
          previousQuantity: inventory.quantity,
          newQuantity: inventory.quantity,
          referenceType: "order",
          referenceId: payment.orderId,
          notes: "Released - Payment failed",
        })
      }
    }

    // Add status history
    await tx.insert(orderStatusHistory).values({
      orderId: payment.orderId,
      fromStatus: "pending_payment",
      toStatus: "pending_payment",
      notes: "Payment attempt failed - customer may retry",
    })
  })

  console.log("Payment failed processed:", payment.id)
}

async function handlePaymentCancelled(
  payment: typeof payments.$inferSelect,
  data: WebhookPayload,
) {
  await db.transaction(async (tx) => {
    // Update payment
    await tx
      .update(payments)
      .set({
        status: "failed",
        externalStatus: "cancelled",
        failureReason: "Payment cancelled by user",
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id))

    // Release reserved inventory
    const items = await tx
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, payment.orderId))

    for (const item of items) {
      if (!item.variantId) continue

      const [inventory] = await tx
        .select()
        .from(inventoryItems)
        .where(eq(inventoryItems.variantId, item.variantId))
        .for("update")

      if (inventory) {
        const newReserved = Math.max(
          0,
          inventory.reservedQuantity - item.quantity,
        )

        await tx
          .update(inventoryItems)
          .set({
            reservedQuantity: newReserved,
            updatedAt: new Date(),
          })
          .where(eq(inventoryItems.id, inventory.id))

        await tx.insert(inventoryMovements).values({
          inventoryItemId: inventory.id,
          type: "released",
          quantity: item.quantity,
          previousQuantity: inventory.quantity,
          newQuantity: inventory.quantity,
          referenceType: "order",
          referenceId: payment.orderId,
          notes: "Released - Payment cancelled",
        })
      }
    }

    // Add status history
    await tx.insert(orderStatusHistory).values({
      orderId: payment.orderId,
      fromStatus: "pending_payment",
      toStatus: "pending_payment",
      notes: "Payment cancelled by customer",
    })
  })

  console.log("Payment cancelled processed:", payment.id)
}
