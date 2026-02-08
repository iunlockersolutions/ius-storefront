"use server"

import { revalidatePath } from "next/cache"

import { and, count, desc, eq, ilike, or } from "drizzle-orm"
import { nanoid } from "nanoid"

import { getServerSession, requireStaff } from "@/lib/auth/rbac"
import { db } from "@/lib/db"
import {
  bankTransferProofs,
  inventoryItems,
  inventoryMovements,
  orderItems,
  orders,
  orderStatusHistory,
  payments,
} from "@/lib/db/schema"

// ============================================
// DirectPay IPG Configuration
// ============================================

const DIRECTPAY_CONFIG = {
  baseUrl: process.env.DIRECTPAY_API_URL || "http://localhost:3001",
  merchantId: process.env.DIRECTPAY_MERCHANT_ID || "MERCHANT_TEST",
  apiKey: process.env.DIRECTPAY_API_KEY || "test_api_key",
  secretKey: process.env.DIRECTPAY_SECRET_KEY || "test_secret_key",
}

// ============================================
// Initiate Card Payment
// ============================================

interface InitiatePaymentInput {
  orderId: string
  returnUrl: string
  cancelUrl: string
}

export async function initiateCardPayment(input: InitiatePaymentInput) {
  const session = await getServerSession()

  // Get order details
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, input.orderId),
  })

  if (!order) {
    return { success: false, error: "Order not found" }
  }

  // Check if order is in correct status for payment
  if (order.status !== "draft" && order.status !== "pending_payment") {
    return { success: false, error: "Order cannot be paid in current status" }
  }

  // Generate idempotency key
  const idempotencyKey = `pay_${order.id}_${Date.now()}`

  try {
    // Create payment record
    const [payment] = await db
      .insert(payments)
      .values({
        orderId: order.id,
        method: "card",
        status: "pending",
        amount: order.total,
        currency: "LKR",
        idempotencyKey,
      })
      .returning()

    // Initiate payment with DirectPay
    const response = await fetch(
      `${DIRECTPAY_CONFIG.baseUrl}/api/v1/payment/initiate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": DIRECTPAY_CONFIG.apiKey,
        },
        body: JSON.stringify({
          merchantId: DIRECTPAY_CONFIG.merchantId,
          amount: parseFloat(order.total),
          currency: "LKR",
          orderId: order.orderNumber,
          description: `Order ${order.orderNumber}`,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone || "",
          customerName: order.customerName || "",
          returnUrl: input.returnUrl,
          cancelUrl: input.cancelUrl,
          notifyUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payment/webhook`,
        }),
      },
    )

    const data = await response.json()

    if (!data.success) {
      // Update payment as failed
      await db
        .update(payments)
        .set({ status: "failed", failureReason: data.error })
        .where(eq(payments.id, payment.id))

      return {
        success: false,
        error: data.error || "Failed to initiate payment",
      }
    }

    // Update payment with session ID
    await db
      .update(payments)
      .set({
        externalId: data.sessionId,
        metadata: JSON.stringify({ paymentUrl: data.paymentUrl }),
      })
      .where(eq(payments.id, payment.id))

    // Update order status
    await db
      .update(orders)
      .set({ status: "pending_payment", updatedAt: new Date() })
      .where(eq(orders.id, order.id))

    return {
      success: true,
      paymentUrl: data.paymentUrl,
      sessionId: data.sessionId,
    }
  } catch (error) {
    console.error("Payment initiation failed:", error)
    return { success: false, error: "Failed to initiate payment" }
  }
}

// ============================================
// Verify Payment Status
// ============================================

export async function verifyPaymentStatus(sessionId: string) {
  try {
    // Find payment by session ID
    const payment = await db.query.payments.findFirst({
      where: eq(payments.externalId, sessionId),
    })

    if (!payment) {
      return { success: false, error: "Payment not found" }
    }

    // Check with DirectPay
    const response = await fetch(
      `${DIRECTPAY_CONFIG.baseUrl}/api/v1/payment/verify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": DIRECTPAY_CONFIG.apiKey,
        },
        body: JSON.stringify({ sessionId }),
      },
    )

    const data = await response.json()

    if (!data.success) {
      return { success: false, error: data.error }
    }

    // Update payment based on status
    const updateData: Partial<typeof payments.$inferInsert> = {
      externalStatus: data.status,
      updatedAt: new Date(),
    }

    if (data.status === "completed") {
      updateData.status = "completed"
      updateData.processedAt = data.paidAt ? new Date(data.paidAt) : new Date()
      updateData.metadata = JSON.stringify({
        transactionId: data.transactionId,
        cardLast4: data.cardLast4,
        cardBrand: data.cardBrand,
      })
    } else if (data.status === "failed") {
      updateData.status = "failed"
      updateData.failureReason = "Payment declined"
    } else if (data.status === "cancelled") {
      updateData.status = "failed"
      updateData.failureReason = "Payment cancelled by user"
    }

    await db.update(payments).set(updateData).where(eq(payments.id, payment.id))

    // If completed, update order status
    if (data.status === "completed") {
      await processSuccessfulPayment(payment.orderId)
    }

    revalidatePath(`/orders/${payment.orderId}`)
    revalidatePath("/admin/orders")
    revalidatePath("/admin/payments")

    return {
      success: true,
      status: data.status,
      transactionId: data.transactionId,
    }
  } catch (error) {
    console.error("Payment verification failed:", error)
    return { success: false, error: "Failed to verify payment" }
  }
}

// ============================================
// Process Successful Payment
// ============================================

async function processSuccessfulPayment(orderId: string) {
  const session = await getServerSession()

  await db.transaction(async (tx) => {
    // Update order status to paid
    await tx
      .update(orders)
      .set({ status: "paid", updatedAt: new Date() })
      .where(eq(orders.id, orderId))

    // Add status history
    await tx.insert(orderStatusHistory).values({
      orderId,
      fromStatus: "pending_payment",
      toStatus: "paid",
      notes: "Payment completed",
      changedBy: session?.user?.id || null,
    })

    // Convert reserved inventory to sold
    const items = await tx
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId))

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
          referenceId: orderId,
          notes: `Sold - Order payment completed`,
        })
      }
    }
  })
}

// ============================================
// Record Bank Transfer Payment
// ============================================

export async function recordBankTransferPayment(orderId: string) {
  const session = await getServerSession()

  // Get order details
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  })

  if (!order) {
    return { success: false, error: "Order not found" }
  }

  // Create pending bank transfer payment
  const [payment] = await db
    .insert(payments)
    .values({
      orderId: order.id,
      method: "bank_transfer",
      status: "pending",
      amount: order.total,
      currency: "LKR",
      idempotencyKey: `bt_${order.id}_${Date.now()}`,
    })
    .returning()

  // Update order status
  await db
    .update(orders)
    .set({ status: "pending_payment", updatedAt: new Date() })
    .where(eq(orders.id, orderId))

  await db.insert(orderStatusHistory).values({
    orderId,
    fromStatus: order.status,
    toStatus: "pending_payment",
    notes: "Bank transfer initiated - awaiting proof of payment",
    changedBy: session?.user?.id || null,
  })

  revalidatePath(`/orders/${orderId}`)

  return { success: true, paymentId: payment.id }
}

// ============================================
// Record Cash on Delivery Payment
// ============================================

export async function recordCODPayment(orderId: string) {
  const session = await getServerSession()

  // Get order details
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  })

  if (!order) {
    return { success: false, error: "Order not found" }
  }

  // Create COD payment record (pending until delivery)
  const [payment] = await db
    .insert(payments)
    .values({
      orderId: order.id,
      method: "cash_on_delivery",
      status: "pending",
      amount: order.total,
      currency: "LKR",
      idempotencyKey: `cod_${order.id}_${Date.now()}`,
    })
    .returning()

  // Update order status to processing (COD orders go directly to processing)
  await db
    .update(orders)
    .set({ status: "processing", updatedAt: new Date() })
    .where(eq(orders.id, orderId))

  await db.insert(orderStatusHistory).values({
    orderId,
    fromStatus: order.status,
    toStatus: "processing",
    notes: "Cash on Delivery order - payment to be collected on delivery",
    changedBy: session?.user?.id || null,
  })

  revalidatePath(`/orders/${orderId}`)

  return { success: true, paymentId: payment.id }
}

// ============================================
// Mark COD Payment as Collected
// ============================================

export async function markCODPaymentCollected(orderId: string) {
  await requireStaff()
  const session = await getServerSession()

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  })

  if (!order) {
    return { success: false, error: "Order not found" }
  }

  const payment = await db.query.payments.findFirst({
    where: and(
      eq(payments.orderId, orderId),
      eq(payments.method, "cash_on_delivery"),
    ),
  })

  if (!payment) {
    return { success: false, error: "COD payment record not found" }
  }

  if (payment.status === "completed") {
    return { success: false, error: "Payment already collected" }
  }

  try {
    await db.transaction(async (tx) => {
      // Update payment as completed
      await tx
        .update(payments)
        .set({
          status: "completed",
          processedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id))

      // Process inventory - convert reserved to sold
      const items = await tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId))

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
            referenceId: orderId,
            notes: "COD payment collected",
          })
        }
      }
    })

    revalidatePath("/admin/orders")
    revalidatePath(`/admin/orders/${orderId}`)
    revalidatePath(`/orders/${orderId}`)

    return { success: true }
  } catch (error) {
    console.error("Failed to mark COD payment as collected:", error)
    return { success: false, error: "Failed to process payment" }
  }
}

// ============================================
// Upload Bank Transfer Proof
// ============================================

export async function uploadBankTransferProof(
  paymentId: string,
  fileUrl: string,
  fileName: string,
  notes?: string,
) {
  await db.insert(bankTransferProofs).values({
    paymentId,
    fileUrl,
    fileName,
    notes,
  })

  revalidatePath("/admin/payments")
  return { success: true }
}

// ============================================
// Admin: Get Payments List
// ============================================

interface PaymentFilterInput {
  page?: number
  limit?: number
  status?: string
  method?: string
  search?: string
}

export async function getPayments(input: PaymentFilterInput = {}) {
  await requireStaff()

  const { page = 1, limit = 20, status, method, search } = input
  const offset = (page - 1) * limit

  let query = db
    .select({
      id: payments.id,
      orderId: payments.orderId,
      method: payments.method,
      status: payments.status,
      amount: payments.amount,
      currency: payments.currency,
      externalId: payments.externalId,
      processedAt: payments.processedAt,
      createdAt: payments.createdAt,
      orderNumber: orders.orderNumber,
      customerEmail: orders.customerEmail,
      customerName: orders.customerName,
    })
    .from(payments)
    .innerJoin(orders, eq(payments.orderId, orders.id))
    .$dynamic()

  // Build where conditions
  const conditions = []
  if (status) {
    conditions.push(eq(payments.status, status as any))
  }
  if (method) {
    conditions.push(eq(payments.method, method as any))
  }
  if (search) {
    conditions.push(
      or(
        ilike(orders.orderNumber, `%${search}%`),
        ilike(orders.customerEmail, `%${search}%`),
      ),
    )
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions))
  }

  const paymentsList = await query
    .orderBy(desc(payments.createdAt))
    .limit(limit)
    .offset(offset)

  // Get total count
  const [totalResult] = await db.select({ count: count() }).from(payments)
  const total = totalResult?.count || 0

  return {
    payments: paymentsList,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

// ============================================
// Admin: Get Pending Bank Transfer Verifications
// ============================================

export async function getPendingBankTransfers() {
  await requireStaff()

  const pending = await db
    .select({
      id: payments.id,
      orderId: payments.orderId,
      amount: payments.amount,
      currency: payments.currency,
      createdAt: payments.createdAt,
      orderNumber: orders.orderNumber,
      customerEmail: orders.customerEmail,
      customerName: orders.customerName,
    })
    .from(payments)
    .innerJoin(orders, eq(payments.orderId, orders.id))
    .where(
      and(eq(payments.method, "bank_transfer"), eq(payments.status, "pending")),
    )
    .orderBy(desc(payments.createdAt))

  // Get proofs for each payment
  const paymentsWithProofs = await Promise.all(
    pending.map(async (payment) => {
      const proofs = await db
        .select()
        .from(bankTransferProofs)
        .where(eq(bankTransferProofs.paymentId, payment.id))
        .orderBy(desc(bankTransferProofs.createdAt))

      return { ...payment, proofs }
    }),
  )

  return paymentsWithProofs
}

// ============================================
// Admin: Verify Bank Transfer
// ============================================

export async function verifyBankTransfer(
  paymentId: string,
  approved: boolean,
  notes?: string,
) {
  await requireStaff()
  const session = await getServerSession()

  const payment = await db.query.payments.findFirst({
    where: eq(payments.id, paymentId),
  })

  if (!payment) {
    return { success: false, error: "Payment not found" }
  }

  if (payment.status !== "pending") {
    return { success: false, error: "Payment already processed" }
  }

  try {
    await db.transaction(async (tx) => {
      if (approved) {
        // Update payment as completed
        await tx
          .update(payments)
          .set({
            status: "completed",
            processedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(payments.id, paymentId))

        // Update proof verification
        await tx
          .update(bankTransferProofs)
          .set({
            verifiedAt: new Date(),
            verifiedBy: session?.user?.id || null,
            verificationNotes: notes,
            isApproved: new Date(),
          })
          .where(eq(bankTransferProofs.paymentId, paymentId))

        // Process the successful payment
        await processSuccessfulPaymentInTx(
          tx,
          payment.orderId,
          session?.user?.id || null,
        )
      } else {
        // Reject the payment
        await tx
          .update(payments)
          .set({
            status: "failed",
            failureReason: notes || "Bank transfer verification failed",
            updatedAt: new Date(),
          })
          .where(eq(payments.id, paymentId))

        await tx
          .update(bankTransferProofs)
          .set({
            verifiedAt: new Date(),
            verifiedBy: session?.user?.id || null,
            verificationNotes: notes,
          })
          .where(eq(bankTransferProofs.paymentId, paymentId))

        // Update order status back to draft
        await tx
          .update(orders)
          .set({ status: "cancelled", updatedAt: new Date() })
          .where(eq(orders.id, payment.orderId))

        await tx.insert(orderStatusHistory).values({
          orderId: payment.orderId,
          fromStatus: "pending_payment",
          toStatus: "cancelled",
          notes: `Bank transfer rejected: ${notes || "Verification failed"}`,
          changedBy: session?.user?.id || null,
        })
      }
    })

    revalidatePath("/admin/payments")
    revalidatePath("/admin/orders")
    revalidatePath(`/admin/orders/${payment.orderId}`)

    return { success: true }
  } catch (error) {
    console.error("Bank transfer verification failed:", error)
    return { success: false, error: "Failed to process verification" }
  }
}

// Helper for transaction context
async function processSuccessfulPaymentInTx(
  tx: any,
  orderId: string,
  userId: string | null,
) {
  await tx
    .update(orders)
    .set({ status: "paid", updatedAt: new Date() })
    .where(eq(orders.id, orderId))

  await tx.insert(orderStatusHistory).values({
    orderId,
    fromStatus: "pending_payment",
    toStatus: "paid",
    notes: "Bank transfer verified",
    changedBy: userId,
  })

  // Convert reserved to sold
  const items = await tx
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId))

  for (const item of items) {
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
        referenceId: orderId,
        notes: "Bank transfer payment verified",
      })
    }
  }
}

// ============================================
// Admin: Get Payment Stats
// ============================================

export async function getPaymentStats() {
  await requireStaff()

  const stats = await db
    .select({
      status: payments.status,
      method: payments.method,
      count: count(),
    })
    .from(payments)
    .groupBy(payments.status, payments.method)

  const pendingBankTransfers = stats
    .filter((s) => s.method === "bank_transfer" && s.status === "pending")
    .reduce((sum, s) => sum + s.count, 0)

  const totalCompleted = stats
    .filter((s) => s.status === "completed")
    .reduce((sum, s) => sum + s.count, 0)

  const totalFailed = stats
    .filter((s) => s.status === "failed")
    .reduce((sum, s) => sum + s.count, 0)

  const totalPending = stats
    .filter((s) => s.status === "pending")
    .reduce((sum, s) => sum + s.count, 0)

  return {
    pendingBankTransfers,
    totalCompleted,
    totalFailed,
    totalPending,
  }
}
